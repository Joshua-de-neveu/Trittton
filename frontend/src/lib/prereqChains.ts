// UCSD Prerequisite Chain Data
// Each entry: course → list of direct prerequisites (must complete ALL to take this course)
// Source: UCSD General Catalog 2025-2026

export interface PrereqNode {
  id: string           // e.g. "CSE 12"
  prereqs: string[]    // direct prerequisites (AND — need all)
  prereqsOr?: string[][] // OR groups — need one from each group
  coreq?: string[]     // corequisites (can take concurrently)
  description?: string
  units?: number
}

export type PrereqGraph = Record<string, PrereqNode>

// ── CSE (Computer Science & Engineering) ──────────────────────────────────

const CSE: PrereqGraph = {
  'CSE 8A':  { id: 'CSE 8A',  prereqs: [], units: 4, description: 'Intro to Programming I' },
  'CSE 8B':  { id: 'CSE 8B',  prereqs: ['CSE 8A'], units: 4, description: 'Intro to Programming II' },
  'CSE 11':  { id: 'CSE 11',  prereqs: [], units: 4, description: 'Intro to Programming & Computational Problem-Solving' },
  'CSE 12':  { id: 'CSE 12',  prereqs: ['CSE 11'], units: 4, description: 'Basic Data Structures & Object-Oriented Design' },
  'CSE 15':  { id: 'CSE 15',  prereqs: ['CSE 11'], units: 4, description: 'Engineering Computation' },
  'CSE 20':  { id: 'CSE 20',  prereqs: ['CSE 11'], units: 4, description: 'Discrete Mathematics' },
  'CSE 21':  { id: 'CSE 21',  prereqs: ['CSE 20'], units: 4, description: 'Mathematics for Algorithms & Systems' },
  'CSE 30':  { id: 'CSE 30',  prereqs: ['CSE 12'], units: 4, description: 'Computer Organization & Systems Programming' },
  'CSE 100': { id: 'CSE 100', prereqs: ['CSE 12', 'CSE 21'], units: 4, description: 'Advanced Data Structures' },
  'CSE 101': { id: 'CSE 101', prereqs: ['CSE 100'], units: 4, description: 'Design & Analysis of Algorithms' },
  'CSE 105': { id: 'CSE 105', prereqs: ['CSE 12', 'CSE 21'], units: 4, description: 'Theory of Computation' },
  'CSE 107': { id: 'CSE 107', prereqs: ['CSE 21'], units: 4, description: 'Intro to Modern Cryptography' },
  'CSE 110': { id: 'CSE 110', prereqs: ['CSE 100'], units: 4, description: 'Software Engineering' },
  'CSE 120': { id: 'CSE 120', prereqs: ['CSE 30', 'CSE 100'], units: 4, description: 'Operating Systems' },
  'CSE 123': { id: 'CSE 123', prereqs: ['CSE 30', 'CSE 100'], units: 4, description: 'Computer Networks' },
  'CSE 124': { id: 'CSE 124', prereqs: ['CSE 123'], units: 4, description: 'Networked Services' },
  'CSE 127': { id: 'CSE 127', prereqs: ['CSE 30', 'CSE 100'], units: 4, description: 'Computer Security' },
  'CSE 130': { id: 'CSE 130', prereqs: ['CSE 100', 'CSE 105'], units: 4, description: 'Programming Languages' },
  'CSE 131': { id: 'CSE 131', prereqs: ['CSE 100'], units: 4, description: 'Compiler Construction' },
  'CSE 132A':{ id: 'CSE 132A',prereqs: ['CSE 100'], units: 4, description: 'Database System Principles' },
  'CSE 134B':{ id: 'CSE 134B',prereqs: ['CSE 100'], units: 4, description: 'Web Client Languages' },
  'CSE 135': { id: 'CSE 135', prereqs: ['CSE 134B'], units: 4, description: 'Server-Side Web Applications' },
  'CSE 140': { id: 'CSE 140', prereqs: ['CSE 30'], units: 4, description: 'Components & Design Techniques for Digital Systems' },
  'CSE 140L':{ id: 'CSE 140L',prereqs: ['CSE 140'], coreq: ['CSE 140'], units: 2, description: 'Digital Systems Laboratory' },
  'CSE 141': { id: 'CSE 141', prereqs: ['CSE 30', 'CSE 140'], units: 4, description: 'Intro to Computer Architecture' },
  'CSE 141L':{ id: 'CSE 141L',prereqs: ['CSE 141'], coreq: ['CSE 141'], units: 2, description: 'Project in Computer Architecture' },
  'CSE 142': { id: 'CSE 142', prereqs: ['CSE 141'], units: 4, description: 'Computer Architecture: A Modern Approach' },
  'CSE 145': { id: 'CSE 145', prereqs: ['CSE 100'], units: 4, description: 'Embedded System Design Project' },
  'CSE 150A':{ id: 'CSE 150A',prereqs: ['CSE 100'], units: 4, description: 'Intro to AI: Probabilistic Reasoning' },
  'CSE 150B':{ id: 'CSE 150B',prereqs: ['CSE 100'], units: 4, description: 'Intro to AI: Search & Reasoning' },
  'CSE 151A':{ id: 'CSE 151A',prereqs: ['CSE 100'], units: 4, description: 'Intro to Machine Learning' },
  'CSE 151B':{ id: 'CSE 151B',prereqs: ['CSE 151A'], units: 4, description: 'Deep Learning' },
  'CSE 152A':{ id: 'CSE 152A',prereqs: ['CSE 100'], units: 4, description: 'Intro to Computer Vision' },
  'CSE 156': { id: 'CSE 156', prereqs: ['CSE 100'], units: 4, description: 'Statistical NLP' },
  'CSE 158': { id: 'CSE 158', prereqs: ['CSE 100'], units: 4, description: 'Recommender Systems & Web Mining' },
  'CSE 160': { id: 'CSE 160', prereqs: ['CSE 100'], units: 4, description: 'Intro to Parallel Computing' },
  'CSE 167': { id: 'CSE 167', prereqs: ['CSE 100'], units: 4, description: 'Computer Graphics' },
}

// ── MATH ──────────────────────────────────────────────────────────────────

const MATH: PrereqGraph = {
  'MATH 4C':  { id: 'MATH 4C',  prereqs: [], units: 4, description: 'Precalculus' },
  'MATH 10A': { id: 'MATH 10A', prereqs: [], units: 4, description: 'Calculus I' },
  'MATH 10B': { id: 'MATH 10B', prereqs: ['MATH 10A'], units: 4, description: 'Calculus II' },
  'MATH 10C': { id: 'MATH 10C', prereqs: ['MATH 10B'], units: 4, description: 'Calculus III' },
  'MATH 11':  { id: 'MATH 11',  prereqs: ['MATH 10A'], units: 5, description: 'Calculus-Based Probability & Statistics' },
  'MATH 18':  { id: 'MATH 18',  prereqs: ['MATH 20A'], units: 4, description: 'Linear Algebra' },
  'MATH 20A': { id: 'MATH 20A', prereqs: [], units: 4, description: 'Calculus for Science & Engineering' },
  'MATH 20B': { id: 'MATH 20B', prereqs: ['MATH 20A'], units: 4, description: 'Calculus for Science & Engineering' },
  'MATH 20C': { id: 'MATH 20C', prereqs: ['MATH 20B'], units: 4, description: 'Calculus & Analytic Geometry for Science & Engineering' },
  'MATH 20D': { id: 'MATH 20D', prereqs: ['MATH 20C', 'MATH 18'], units: 4, description: 'Intro to Differential Equations' },
  'MATH 20E': { id: 'MATH 20E', prereqs: ['MATH 20C', 'MATH 18'], units: 4, description: 'Vector Calculus' },
  'MATH 100A':{ id: 'MATH 100A',prereqs: ['MATH 18', 'MATH 20C'], units: 4, description: 'Abstract Algebra I' },
  'MATH 100B':{ id: 'MATH 100B',prereqs: ['MATH 100A'], units: 4, description: 'Abstract Algebra II' },
  'MATH 100C':{ id: 'MATH 100C',prereqs: ['MATH 100B'], units: 4, description: 'Abstract Algebra III' },
  'MATH 109': { id: 'MATH 109', prereqs: ['MATH 18', 'MATH 20C'], units: 4, description: 'Mathematical Reasoning' },
  'MATH 140A':{ id: 'MATH 140A',prereqs: ['MATH 109', 'MATH 20C', 'MATH 18'], units: 4, description: 'Foundations of Real Analysis I' },
  'MATH 140B':{ id: 'MATH 140B',prereqs: ['MATH 140A'], units: 4, description: 'Foundations of Real Analysis II' },
  'MATH 142A':{ id: 'MATH 142A',prereqs: ['MATH 20C', 'MATH 18'], units: 4, description: 'Intro to Analysis I' },
  'MATH 142B':{ id: 'MATH 142B',prereqs: ['MATH 142A'], units: 4, description: 'Intro to Analysis II' },
  'MATH 170A':{ id: 'MATH 170A',prereqs: ['MATH 18', 'MATH 20C'], units: 4, description: 'Intro to Numerical Analysis: Linear Algebra' },
  'MATH 180A':{ id: 'MATH 180A',prereqs: ['MATH 20C', 'MATH 18'], units: 4, description: 'Intro to Probability' },
  'MATH 180B':{ id: 'MATH 180B',prereqs: ['MATH 180A'], units: 4, description: 'Intro to Stochastic Processes' },
  'MATH 183': { id: 'MATH 183', prereqs: ['MATH 180A'], units: 4, description: 'Statistical Methods' },
}

// ── ECE (Electrical & Computer Engineering) ───────────────────────────────

const ECE: PrereqGraph = {
  'ECE 15':   { id: 'ECE 15',   prereqs: [], units: 4, description: 'Engineering Computation' },
  'ECE 25':   { id: 'ECE 25',   prereqs: [], units: 4, description: 'Intro to Digital Design' },
  'ECE 35':   { id: 'ECE 35',   prereqs: ['MATH 20C', 'PHYS 2B'], units: 4, description: 'Intro to Analog Design' },
  'ECE 45':   { id: 'ECE 45',   prereqs: ['MATH 20D', 'ECE 35'], units: 4, description: 'Circuits & Systems' },
  'ECE 65':   { id: 'ECE 65',   prereqs: ['ECE 25', 'ECE 35'], units: 4, description: 'Components & Circuits Laboratory' },
  'ECE 100':  { id: 'ECE 100',  prereqs: ['ECE 45'], units: 4, description: 'Linear Electronic Systems' },
  'ECE 101':  { id: 'ECE 101',  prereqs: ['ECE 45'], units: 4, description: 'Linear Systems Fundamentals' },
  'ECE 107':  { id: 'ECE 107',  prereqs: ['MATH 20E', 'PHYS 2C'], units: 4, description: 'Electromagnetism' },
  'ECE 109':  { id: 'ECE 109',  prereqs: ['MATH 20C'], units: 4, description: 'Engineering Probability & Statistics' },
  'ECE 111':  { id: 'ECE 111',  prereqs: ['ECE 25', 'ECE 65'], units: 4, description: 'Advanced Digital Design Project' },
  'ECE 140A': { id: 'ECE 140A', prereqs: ['ECE 15'], units: 4, description: 'Components of the Internet of Things' },
  'ECE 140B': { id: 'ECE 140B', prereqs: ['ECE 140A'], units: 4, description: 'Internet of Things: Build Your Startup' },
  'ECE 161A': { id: 'ECE 161A', prereqs: ['ECE 101'], units: 4, description: 'Intro to Digital Signal Processing' },
  'ECE 171A': { id: 'ECE 171A', prereqs: ['ECE 101'], units: 4, description: 'Linear Control System Theory' },
  'ECE 174':  { id: 'ECE 174',  prereqs: ['MATH 18', 'ECE 109'], units: 4, description: 'Intro to Linear & Nonlinear Optimization' },
}

// ── PHYS ──────────────────────────────────────────────────────────────────

const PHYS: PrereqGraph = {
  'PHYS 1A':  { id: 'PHYS 1A',  prereqs: ['MATH 10A'], units: 4, description: 'Mechanics' },
  'PHYS 1B':  { id: 'PHYS 1B',  prereqs: ['PHYS 1A', 'MATH 10B'], units: 4, description: 'Electricity & Magnetism' },
  'PHYS 1C':  { id: 'PHYS 1C',  prereqs: ['PHYS 1B', 'MATH 10C'], units: 4, description: 'Waves, Optics & Modern Physics' },
  'PHYS 2A':  { id: 'PHYS 2A',  prereqs: ['MATH 20A'], units: 4, description: 'Mechanics' },
  'PHYS 2B':  { id: 'PHYS 2B',  prereqs: ['PHYS 2A', 'MATH 20B'], units: 4, description: 'Electricity & Magnetism' },
  'PHYS 2C':  { id: 'PHYS 2C',  prereqs: ['PHYS 2B', 'MATH 20C'], units: 4, description: 'Fluids, Waves, Thermodynamics & Optics' },
  'PHYS 2D':  { id: 'PHYS 2D',  prereqs: ['PHYS 2C'], units: 4, description: 'Relativity & Quantum Physics' },
  'PHYS 100A':{ id: 'PHYS 100A',prereqs: ['PHYS 2D', 'MATH 20D', 'MATH 18'], units: 4, description: 'Electromagnetism I' },
  'PHYS 105A':{ id: 'PHYS 105A',prereqs: ['PHYS 2A', 'MATH 20D', 'MATH 18'], units: 4, description: 'Classical Mechanics' },
  'PHYS 110A':{ id: 'PHYS 110A',prereqs: ['PHYS 2D', 'MATH 20D'], units: 4, description: 'Quantum Mechanics I' },
  'PHYS 120': { id: 'PHYS 120', prereqs: ['PHYS 2D', 'MATH 20D'], units: 4, description: 'Thermodynamics & Statistical Mechanics' },
  'PHYS 140A':{ id: 'PHYS 140A',prereqs: ['PHYS 120'], units: 4, description: 'Solid State Physics' },
}

// ── BILD / Bio ────────────────────────────────────────────────────────────

const BIO: PrereqGraph = {
  'BILD 1':   { id: 'BILD 1',   prereqs: [], units: 4, description: 'The Cell' },
  'BILD 2':   { id: 'BILD 2',   prereqs: [], units: 4, description: 'Multicellular Life' },
  'BILD 3':   { id: 'BILD 3',   prereqs: [], units: 4, description: 'Organismic & Evolutionary Biology' },
  'BILD 4':   { id: 'BILD 4',   prereqs: ['BILD 1'], units: 4, description: 'Bioinformatics' },
  'BICD 100': { id: 'BICD 100', prereqs: ['BILD 1'], units: 4, description: 'Genetics' },
  'BICD 110': { id: 'BICD 110', prereqs: ['BICD 100'], units: 4, description: 'Cell Biology' },
  'BIBC 100': { id: 'BIBC 100', prereqs: ['BILD 1', 'CHEM 6C'], units: 4, description: 'Structural Biochemistry' },
  'BIBC 102': { id: 'BIBC 102', prereqs: ['BIBC 100'], units: 4, description: 'Metabolic Biochemistry' },
  'BIPN 100': { id: 'BIPN 100', prereqs: ['BILD 1', 'BILD 2'], units: 4, description: 'Human Physiology I' },
  'BIPN 102': { id: 'BIPN 102', prereqs: ['BIPN 100'], units: 4, description: 'Human Physiology II' },
  'BIMM 100': { id: 'BIMM 100', prereqs: ['BICD 100'], units: 4, description: 'Molecular Biology' },
  'BIMM 101': { id: 'BIMM 101', prereqs: ['BIMM 100'], units: 4, description: 'Recombinant DNA Techniques' },
}

// ── CHEM ──────────────────────────────────────────────────────────────────

const CHEM: PrereqGraph = {
  'CHEM 4':   { id: 'CHEM 4',   prereqs: [], units: 4, description: 'Intro General Chemistry' },
  'CHEM 6A':  { id: 'CHEM 6A',  prereqs: [], units: 4, description: 'General Chemistry I' },
  'CHEM 6B':  { id: 'CHEM 6B',  prereqs: ['CHEM 6A'], units: 4, description: 'General Chemistry II' },
  'CHEM 6C':  { id: 'CHEM 6C',  prereqs: ['CHEM 6B'], units: 4, description: 'General Chemistry III' },
  'CHEM 40A': { id: 'CHEM 40A', prereqs: ['CHEM 6C'], units: 4, description: 'Organic Chemistry I' },
  'CHEM 40B': { id: 'CHEM 40B', prereqs: ['CHEM 40A'], units: 4, description: 'Organic Chemistry II' },
  'CHEM 40C': { id: 'CHEM 40C', prereqs: ['CHEM 40B'], units: 4, description: 'Organic Chemistry III' },
  'CHEM 43A': { id: 'CHEM 43A', prereqs: ['CHEM 6C'], units: 2, description: 'Organic Chemistry Lab I' },
  'CHEM 100A':{ id: 'CHEM 100A',prereqs: ['CHEM 6C', 'MATH 20B', 'PHYS 2A'], units: 4, description: 'Physical Chemistry I: Thermodynamics' },
  'CHEM 100B':{ id: 'CHEM 100B',prereqs: ['CHEM 100A', 'MATH 20C'], units: 4, description: 'Physical Chemistry II: Quantum Mechanics' },
  'CHEM 114A':{ id: 'CHEM 114A',prereqs: ['CHEM 40C', 'BIBC 100'], units: 4, description: 'Biochemistry I' },
}

// ── ECON ──────────────────────────────────────────────────────────────────

const ECON: PrereqGraph = {
  'ECON 1':   { id: 'ECON 1',   prereqs: [], units: 4, description: 'Principles of Microeconomics' },
  'ECON 2':   { id: 'ECON 2',   prereqs: [], units: 4, description: 'Market Imperfections & Policy' },
  'ECON 3':   { id: 'ECON 3',   prereqs: [], units: 4, description: 'Principles of Macroeconomics' },
  'ECON 4':   { id: 'ECON 4',   prereqs: [], units: 4, description: 'Financial Accounting' },
  'ECON 100A':{ id: 'ECON 100A',prereqs: ['ECON 1', 'MATH 20A'], units: 4, description: 'Microeconomics A' },
  'ECON 100B':{ id: 'ECON 100B',prereqs: ['ECON 100A', 'MATH 20B'], units: 4, description: 'Microeconomics B' },
  'ECON 100C':{ id: 'ECON 100C',prereqs: ['ECON 100B', 'MATH 20C'], units: 4, description: 'Microeconomics C' },
  'ECON 110A':{ id: 'ECON 110A',prereqs: ['ECON 3', 'MATH 20A'], units: 4, description: 'Macroeconomics A' },
  'ECON 110B':{ id: 'ECON 110B',prereqs: ['ECON 110A', 'MATH 20B'], units: 4, description: 'Macroeconomics B' },
  'ECON 120A':{ id: 'ECON 120A',prereqs: ['ECON 1', 'MATH 20A'], units: 4, description: 'Econometrics A' },
  'ECON 120B':{ id: 'ECON 120B',prereqs: ['ECON 120A', 'MATH 20B'], units: 4, description: 'Econometrics B' },
  'ECON 120C':{ id: 'ECON 120C',prereqs: ['ECON 120B'], units: 4, description: 'Econometrics C' },
  'ECON 130': { id: 'ECON 130', prereqs: ['ECON 100B'], units: 4, description: 'Public Policy' },
  'ECON 170': { id: 'ECON 170', prereqs: ['ECON 100A'], units: 4, description: 'Law & Economics' },
  'ECON 171': { id: 'ECON 171', prereqs: ['ECON 100A'], units: 4, description: 'Decisions Under Uncertainty' },
  'ECON 172A':{ id: 'ECON 172A',prereqs: ['ECON 100A', 'ECON 120A'], units: 4, description: 'Operations Research A' },
}

// ── COGS ──────────────────────────────────────────────────────────────────

const COGS: PrereqGraph = {
  'COGS 1':   { id: 'COGS 1',   prereqs: [], units: 4, description: 'Intro to Cognitive Science' },
  'COGS 9':   { id: 'COGS 9',   prereqs: [], units: 4, description: 'Intro to Data Science' },
  'COGS 10':  { id: 'COGS 10',  prereqs: [], units: 4, description: 'Cognitive Consequences of Technology' },
  'COGS 14A': { id: 'COGS 14A', prereqs: [], units: 4, description: 'Intro to Research Methods' },
  'COGS 14B': { id: 'COGS 14B', prereqs: ['COGS 14A'], units: 4, description: 'Intro to Statistical Analysis' },
  'COGS 18':  { id: 'COGS 18',  prereqs: [], units: 4, description: 'Intro to Python' },
  'COGS 100': { id: 'COGS 100', prereqs: ['COGS 1'], units: 4, description: 'Cyborgs Now & in the Future' },
  'COGS 101A':{ id: 'COGS 101A',prereqs: ['COGS 1'], units: 4, description: 'Sensation & Perception' },
  'COGS 101B':{ id: 'COGS 101B',prereqs: ['COGS 1'], units: 4, description: 'Learning, Memory, & Attention' },
  'COGS 101C':{ id: 'COGS 101C',prereqs: ['COGS 1'], units: 4, description: 'Language' },
  'COGS 107':  { id: 'COGS 107', prereqs: ['COGS 14B'], units: 4, description: 'Neuroanatomy & Physiology' },
  'COGS 108': { id: 'COGS 108', prereqs: ['COGS 18'], units: 4, description: 'Data Science in Practice' },
  'COGS 118A':{ id: 'COGS 118A',prereqs: ['COGS 18', 'MATH 18'], units: 4, description: 'Supervised Machine Learning Algorithms' },
  'COGS 118B':{ id: 'COGS 118B',prereqs: ['COGS 118A'], units: 4, description: 'Intro to Machine Learning' },
  'COGS 120': { id: 'COGS 120', prereqs: ['COGS 18'], units: 4, description: 'Interaction Design' },
  'COGS 181': { id: 'COGS 181', prereqs: ['COGS 118A'], units: 4, description: 'Neural Networks & Deep Learning' },
}

// ── DSC (Data Science) ────────────────────────────────────────────────────

const DSC: PrereqGraph = {
  'DSC 10':   { id: 'DSC 10',   prereqs: [], units: 4, description: 'Principles of Data Science' },
  'DSC 20':   { id: 'DSC 20',   prereqs: ['DSC 10'], units: 4, description: 'Programming & Data Structures for Data Science' },
  'DSC 30':   { id: 'DSC 30',   prereqs: ['DSC 20'], units: 4, description: 'Data Structures & Algorithms for Data Science' },
  'DSC 40A':  { id: 'DSC 40A',  prereqs: ['DSC 10', 'MATH 20C'], units: 4, description: 'Theoretical Foundations of Data Science I' },
  'DSC 40B':  { id: 'DSC 40B',  prereqs: ['DSC 20', 'DSC 40A'], units: 4, description: 'Theoretical Foundations of Data Science II' },
  'DSC 80':   { id: 'DSC 80',   prereqs: ['DSC 30', 'DSC 40A'], units: 4, description: 'Practice of Data Science' },
  'DSC 100':  { id: 'DSC 100',  prereqs: ['DSC 80', 'DSC 40B'], units: 4, description: 'Intro to Data Management' },
  'DSC 102':  { id: 'DSC 102',  prereqs: ['DSC 100'], units: 4, description: 'Systems for Scalable Analytics' },
  'DSC 106':  { id: 'DSC 106',  prereqs: ['DSC 80'], units: 4, description: 'Intro to Data Visualization' },
  'DSC 140A': { id: 'DSC 140A', prereqs: ['DSC 80', 'DSC 40B', 'MATH 18'], units: 4, description: 'Probabilistic Modeling & ML' },
  'DSC 140B': { id: 'DSC 140B', prereqs: ['DSC 140A'], units: 4, description: 'Representation Learning' },
  'DSC 148':  { id: 'DSC 148',  prereqs: ['DSC 80', 'DSC 40B'], units: 4, description: 'Intro to Data Mining' },
  'DSC 180A': { id: 'DSC 180A', prereqs: ['DSC 80', 'DSC 40B'], units: 4, description: 'Data Science Project I' },
  'DSC 180B': { id: 'DSC 180B', prereqs: ['DSC 180A'], units: 4, description: 'Data Science Project II' },
}

// ── Merge all into one graph ──────────────────────────────────────────────

export const PREREQ_GRAPH: PrereqGraph = {
  ...CSE, ...MATH, ...ECE, ...PHYS, ...BIO, ...CHEM, ...ECON, ...COGS, ...DSC,
}

export const DEPARTMENTS = [
  { id: 'CSE',  label: 'Computer Science',    courses: Object.keys(CSE) },
  { id: 'MATH', label: 'Mathematics',          courses: Object.keys(MATH) },
  { id: 'ECE',  label: 'Electrical & Computer Eng.', courses: Object.keys(ECE) },
  { id: 'DSC',  label: 'Data Science',         courses: Object.keys(DSC) },
  { id: 'PHYS', label: 'Physics',              courses: Object.keys(PHYS) },
  { id: 'CHEM', label: 'Chemistry',            courses: Object.keys(CHEM) },
  { id: 'BIO',  label: 'Biology',              courses: Object.keys(BIO) },
  { id: 'ECON', label: 'Economics',             courses: Object.keys(ECON) },
  { id: 'COGS', label: 'Cognitive Science',     courses: Object.keys(COGS) },
]

// ── Graph utility functions ──────────────────────────────────────────────

/** Get all courses that directly require this course as a prerequisite */
export function getUnlocks(courseId: string): string[] {
  return Object.values(PREREQ_GRAPH)
    .filter(n => n.prereqs.includes(courseId))
    .map(n => n.id)
}

/** Get the depth (longest chain from a root) of a course */
export function getDepth(courseId: string, visited = new Set<string>()): number {
  if (visited.has(courseId)) return 0
  visited.add(courseId)
  const node = PREREQ_GRAPH[courseId]
  if (!node || node.prereqs.length === 0) return 0
  return 1 + Math.max(...node.prereqs.map(p => getDepth(p, visited)))
}

/** Check if all prereqs for a course are satisfied */
export function canTake(courseId: string, completed: Set<string>): boolean {
  const node = PREREQ_GRAPH[courseId]
  if (!node) return true
  return node.prereqs.every(p => completed.has(p))
}

/** Get status of a course relative to completed set */
export type CourseStatus = 'completed' | 'available' | 'locked'
export function getCourseStatus(courseId: string, completed: Set<string>): CourseStatus {
  if (completed.has(courseId)) return 'completed'
  if (canTake(courseId, completed)) return 'available'
  return 'locked'
}
