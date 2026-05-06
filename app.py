"""
tritonlink_scraper.py
=====================
Scrapes the UCSD Schedule of Classes (public, no login needed).

Outputs per course:
  - course_code  e.g. "ECE 15"
  - title        e.g. "Eng Computation: Prgrm in C"
  - units        e.g. "4"
  - restrictions e.g. "FR JR SO"
  - sections:
      section_id, type (LE/DI/LA), section (A01), days, time,
      building, room, instructor, available seats, limit, waitlisted

Install deps:
    pip3 install requests beautifulsoup4 lxml

Just hit Play — scrapes all departments automatically.
"""

import json
import re
import time
import logging

import requests
from bs4 import BeautifulSoup

# ── Config ────────────────────────────────────────────────────────────────────

SOC_URL = "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm"
TERM    = "SP26"            # Change if needed: WI26, FA25, S126, S226
OUTPUT  = "all_courses.json"
DELAY   = 1.0               # seconds between requests

HEADERS = {
    "User-Agent":   "Mozilla/5.0 (compatible; UCSDCourseScraper/3.0; personal/educational)",
    "Referer":      "https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudent.htm",
    "Content-Type": "application/x-www-form-urlencoded",
}

def _fetch_subjects(term):
    """Fetch the live subject list from UCSD for a given term."""
    try:
        r = requests.get(
            f"https://act.ucsd.edu/scheduleOfClasses/subject-list.json?selectedTerm={term}",
            headers={"User-Agent": HEADERS["User-Agent"], "Referer": HEADERS["Referer"]},
            timeout=15,
        )
        r.raise_for_status()
        return [s["code"].strip() for s in r.json() if s.get("code", "").strip()]
    except Exception as e:
        logging.error("Failed to fetch subject list: %s", e)
        return []


# Fallback list in case the dynamic fetch fails
ALL_SUBJECTS = [
    "AAS","AIP","ANBI","ANSC","ANTH","ANAR","ANES","ASTR","AUD","AWP",
    "BENG","BNFO","BIEB","BICD","BIPN","BIBC","BGGN","BGJC","BGRD","BGSE","BILD","BIMM","BISP","BIOM",
    "CMM","CENG","CHEM","CLX","CHIN","CLAS","CCS","CLIN","CLRE","COGS","COMM","COGR","CSS","CSE","COSE","CCE","CGS","CAT",
    "TDDM","TDHD","TDMV","TDPF","TDTR","DSC","DSE","DERM","DSGN","DOC","DDPM",
    "ECON","EAP","EDS","ERC","ECE","EMED","ENG","ENVR","ESYS","ETIM","ETHN","EXPR",
    "FPM","FILM",
    "GPCO","GPEC","GPGN","GPIM","GPLA","GPPA","GPPS","GLBH","GSS",
    "HITO","HIAF","HIEA","HIEU","HILA","HISC","HISA","HINE","HIUS","HIGL","HIGR","HILD","HDS","HUM",
    "INTL","JAPN","JWSP",
    "LATI","LISL","LIAB","LIDS","LIFR","LIGN","LIGM","LIHL","LIIT","LIPO","LISP",
    "LTAM","LTCO","LTCS","LTEU","LTFR","LTGM","LTGK","LTIT","LTKO","LTLA","LTRU","LTSP","LTTH","LTWR","LTEN","LTWL","LTEA",
    "MMW","MBC","MATS","MATH","MSED","MAE","MED","MUIR","MCWP","MUS",
    "NANO","NEU","NEUG","OBG","OPTH","ORTH",
    "PATH","PEDS","PHAR","SPPS","PHIL","PAE","PHYS","POLI","PSY","PSYC","PH","PHB",
    "RMAS","RAD","MGTF","MGT","MGTA","MGTP","RELI","RMED","REV",
    "SPPH","SOMI","SOMC","SIOC","SIOG","SIOB","SIO","SEV","SOCG","SOCE","SOCI","SE","SURG","SYN",
    "TDAC","TDDE","TDDR","TDGE","TDGR","TDHT","TDPW","TDPR","TMC",
    "USP","UROL","VIS","WARR","WCWP","WES",
]

VALID_TYPES = {"LE", "DI", "LA", "SE", "IN", "TA", "TU", "CL", "ST"}

# ── Fetch ─────────────────────────────────────────────────────────────────────

def fetch_subject(session, term, subject):
    """Fetch all pages of results for a subject, returning a list of HTML strings."""
    payload = {
        "selectedTerm":      term,
        "selectedSubjects":  subject,
        "schedOption1":      "true",
        "schedOption2":      "true",
        "courses":           "",
        "sections":          "",
        "instructorType":    "begin",
        "instructor":        "",
        "titleType":         "contain",
        "title":             "",
        "_selectedSubjects": "1",
        "schedOption1Grad":  "true",
        "schedOption2Grad":  "true",
    }
    try:
        r = session.post(SOC_URL, data=payload, headers=HEADERS, timeout=30)
        r.raise_for_status()
        pages = [r.text]

        # Check for pagination
        soup = BeautifulSoup(r.text, "lxml")
        last_link = soup.find("a", string="Last")
        if last_link:
            m = re.search(r"page=(\d+)", last_link.get("href", ""))
            total_pages = int(m.group(1)) if m else 1
        else:
            total_pages = 1

        for page in range(2, total_pages + 1):
            rp = session.get(f"{SOC_URL}?page={page}", headers=HEADERS, timeout=30)
            rp.raise_for_status()
            pages.append(rp.text)

        return pages
    except requests.RequestException as e:
        logging.error("Error fetching %s: %s", subject, e)
        return None

# ── Parse ─────────────────────────────────────────────────────────────────────

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def parse_html(html, subject):
    """
    Real UCSD SoC HTML structure (verified from live page):

    Course header — class='crsheader', 3-4 <td> cells:
        [0] restrictions  e.g. "FR JR SO"
        [1] course number e.g. "15"
        [2] title + units e.g. "Eng Computation: Prgrm in C ( 4 Units)"
        [3] links (ignored)

    Section row — class='brdr', 13 <td> cells:
        [0]  blank
        [1]  blank
        [2]  section ID   e.g. "90971" (blank for LE A00)
        [3]  type         e.g. "LE" "DI" "LA"
        [4]  section      e.g. "A00" "A01"
        [5]  days         e.g. "TuTh"
        [6]  time         e.g. "5:00p-6:20p"
        [7]  building     e.g. "CENTR"
        [8]  room         e.g. "109"
        [9]  instructor   e.g. "Sahay, Rajeev"
        [10] available    e.g. "9" or "FULL Waitlist(6)"
        [11] limit        e.g. "146"
        [12] blank

    Some courses have two crsheader rows for the same course number
    (one without units, one with). We merge these by reusing the last
    course object when the course number is the same.
    """
    soup = BeautifulSoup(html, "lxml")
    courses = []
    current = None

    for tr in soup.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if not tds:
            continue

        row_class = " ".join(tds[0].get("class", []))

        # ── Course header ─────────────────────────────────────────────────
        if "crsheader" in row_class:
            texts = [clean(td.get_text(" ")) for td in tds]
            if len(texts) < 3:
                continue

            restrictions = texts[0]
            course_num   = texts[1]
            title_raw    = texts[2]

            # Must be a real course number (digits, maybe with letters like "20C")
            if not re.match(r"^\d", course_num):
                continue

            units_match = re.search(r"\(\s*(\d+\.?\d*)\s*(?:Units?)?\s*\)", title_raw, re.I)
            units = units_match.group(1) if units_match else ""
            title = re.sub(r"\s*\(\s*\d+\.?\d*\s*(?:Units?)?\s*\)", "", title_raw).strip()

            course_code = f"{subject} {course_num}"

            # Merge with previous course if same code (duplicate headers)
            if current and current["course_code"] == course_code:
                # Update units/restrictions if this row has better info
                if units and not current["units"]:
                    current["units"] = units
                if restrictions and not current["restrictions"]:
                    current["restrictions"] = restrictions
            else:
                current = {
                    "subject":      subject,
                    "course_code":  course_code,
                    "title":        title,
                    "units":        units,
                    "restrictions": restrictions,
                    "sections":     [],
                }
                courses.append(current)
            continue

        # ── Section row ───────────────────────────────────────────────────
        if current is None or "brdr" not in row_class:
            continue

        texts = [clean(td.get_text(" ")) for td in tds]
        if len(texts) < 13:
            continue

        section_type = texts[3]
        if section_type not in VALID_TYPES:
            continue

        available_raw = texts[10]
        waitlist_match = re.search(r"Waitlist\((\d+)\)", available_raw)
        if waitlist_match:
            available  = "0"
            waitlisted = waitlist_match.group(1)
        elif "FULL" in available_raw:
            available  = "0"
            waitlisted = ""
        else:
            available  = available_raw
            waitlisted = ""

        sec = {
            "section_id": texts[2],
            "type":       section_type,
            "section":    texts[4],
            "days":       texts[5],
            "time":       texts[6],
            "building":   texts[7],
            "room":       texts[8],
            "instructor": texts[9],
            "available":  available,
            "limit":      texts[11],
            "waitlisted": waitlisted,
        }
        current["sections"].append(sec)

    return courses

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    from concurrent.futures import ThreadPoolExecutor, as_completed

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    subjects = _fetch_subjects(TERM)
    if not subjects:
        print("Could not fetch live subject list, using fallback")
        subjects = ALL_SUBJECTS
    else:
        print(f"Fetched {len(subjects)} subjects from UCSD")

    total = len(subjects)
    print("UCSD Schedule of Classes Scraper")
    print(f"Term: {TERM}  |  Departments: {total}  |  Output: {OUTPUT}")
    print(f"Workers: 12 concurrent\n")

    results: dict[int, list] = {}
    completed = 0
    start_time = time.time()

    WORKERS = 12

    def _fetch_one(idx: int, subject: str) -> tuple[int, str, list | None]:
        session = requests.Session()
        pages = fetch_subject(session, TERM, subject)
        if pages is None:
            return (idx, subject, None)
        courses = []
        for html in pages:
            courses.extend(parse_html(html, subject))
        return (idx, subject, courses)

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(_fetch_one, i, subj): (i, subj)
            for i, subj in enumerate(subjects)
        }

        for future in as_completed(futures):
            idx, subject, courses = future.result()
            completed += 1

            if courses is None:
                print(f"[{completed:3}/{total}] {subject:<8} ... FAILED")
            else:
                results[idx] = courses
                sections = sum(len(c["sections"]) for c in courses)
                total_so_far = sum(len(r) for r in results.values())
                print(f"[{completed:3}/{total}] {subject:<8} ... {len(courses):3} courses, {sections:4} sections  (total: {total_so_far})")

    # Reassemble in original department order
    all_courses = []
    for i in range(total):
        all_courses.extend(results.get(i, []))

    elapsed = time.time() - start_time
    print(f"\n── Done: {len(all_courses)} total courses in {elapsed:.1f}s ──")
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(all_courses, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved to {OUTPUT}")

if __name__ == "__main__":
    main()
