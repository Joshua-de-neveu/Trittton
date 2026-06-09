// UCSD Prerequisite Chain Data — comprehensive coverage for major departments
// Source: UCSD General Catalog 2025-2026

export interface PrereqNode {
  id: string
  prereqs: string[]    // direct prerequisites (AND)
  coreq?: string[]
}

export type PrereqGraph = Record<string, PrereqNode>

// Helper to define nodes concisely: [courseId, ...prereqs]
function p(id: string, ...prereqs: string[]): [string, PrereqNode] {
  return [id, { id, prereqs }]
}

// ── CSE ───────────────────────────────────────────────────────────────────
const CSE = Object.fromEntries([
  p('CSE 8A'), p('CSE 8B', 'CSE 8A'), p('CSE 11'), p('CSE 12', 'CSE 11'),
  p('CSE 15', 'CSE 11'), p('CSE 20', 'CSE 11'), p('CSE 21', 'CSE 20'),
  p('CSE 30', 'CSE 12'), p('CSE 100', 'CSE 12', 'CSE 21'),
  p('CSE 101', 'CSE 100'), p('CSE 105', 'CSE 12', 'CSE 21'),
  p('CSE 107', 'CSE 21'), p('CSE 110', 'CSE 100'),
  p('CSE 112', 'CSE 110'), p('CSE 120', 'CSE 30', 'CSE 100'),
  p('CSE 123', 'CSE 30', 'CSE 100'), p('CSE 124', 'CSE 123'),
  p('CSE 125', 'CSE 100'), p('CSE 127', 'CSE 30', 'CSE 100'),
  p('CSE 130', 'CSE 100', 'CSE 105'), p('CSE 131', 'CSE 100'),
  p('CSE 132A', 'CSE 100'), p('CSE 132B', 'CSE 132A'),
  p('CSE 134B', 'CSE 100'), p('CSE 135', 'CSE 134B'),
  p('CSE 136', 'CSE 100'), p('CSE 138', 'CSE 100'),
  p('CSE 140', 'CSE 30'), p('CSE 140L', 'CSE 140'),
  p('CSE 141', 'CSE 30', 'CSE 140'), p('CSE 141L', 'CSE 141'),
  p('CSE 142', 'CSE 141'), p('CSE 143', 'CSE 141'),
  p('CSE 144', 'CSE 100'), p('CSE 145', 'CSE 100'),
  p('CSE 148', 'CSE 100'), p('CSE 150A', 'CSE 100'),
  p('CSE 150B', 'CSE 100'), p('CSE 151A', 'CSE 100'),
  p('CSE 151B', 'CSE 151A'), p('CSE 152A', 'CSE 100'),
  p('CSE 152B', 'CSE 152A'), p('CSE 153', 'CSE 100'),
  p('CSE 154', 'CSE 100'), p('CSE 156', 'CSE 100'),
  p('CSE 158', 'CSE 100'), p('CSE 160', 'CSE 100'),
  p('CSE 163', 'CSE 100'), p('CSE 164', 'CSE 163'),
  p('CSE 166', 'CSE 100'), p('CSE 167', 'CSE 100'),
  p('CSE 168', 'CSE 167'), p('CSE 169', 'CSE 167'),
  p('CSE 170', 'CSE 100'), p('CSE 175', 'CSE 100'),
  p('CSE 176', 'CSE 100'), p('CSE 180', 'CSE 100'),
  p('CSE 181', 'CSE 100'), p('CSE 182', 'CSE 100'),
  p('CSE 184', 'CSE 100'), p('CSE 185', 'CSE 100'),
  p('CSE 189', 'CSE 100'), p('CSE 190', 'CSE 100'), p('CSE 191', 'CSE 100'),
])

// ── MATH ──────────────────────────────────────────────────────────────────
const MATH = Object.fromEntries([
  p('MATH 4C'), p('MATH 10A'), p('MATH 10B', 'MATH 10A'), p('MATH 10C', 'MATH 10B'),
  p('MATH 11', 'MATH 10A'), p('MATH 15A'), p('MATH 15B', 'MATH 15A'),
  p('MATH 18', 'MATH 20A'), p('MATH 20A'), p('MATH 20B', 'MATH 20A'),
  p('MATH 20C', 'MATH 20B'), p('MATH 20D', 'MATH 20C', 'MATH 18'),
  p('MATH 20E', 'MATH 20C', 'MATH 18'), p('MATH 31AH'),
  p('MATH 31BH', 'MATH 31AH'), p('MATH 31CH', 'MATH 31BH'),
  p('MATH 100A', 'MATH 18', 'MATH 20C'), p('MATH 100B', 'MATH 100A'),
  p('MATH 100C', 'MATH 100B'), p('MATH 102', 'MATH 100A'),
  p('MATH 103A', 'MATH 100A'), p('MATH 103B', 'MATH 103A'),
  p('MATH 104A', 'MATH 20D'), p('MATH 104B', 'MATH 104A'),
  p('MATH 109', 'MATH 18', 'MATH 20C'),
  p('MATH 120A', 'MATH 109', 'MATH 20C'), p('MATH 120B', 'MATH 120A'),
  p('MATH 130', 'MATH 100A'), p('MATH 140A', 'MATH 109', 'MATH 20C', 'MATH 18'),
  p('MATH 140B', 'MATH 140A'), p('MATH 140C', 'MATH 140B'),
  p('MATH 142A', 'MATH 20C', 'MATH 18'), p('MATH 142B', 'MATH 142A'),
  p('MATH 150A', 'MATH 20D', 'MATH 18'), p('MATH 150B', 'MATH 150A'),
  p('MATH 154', 'MATH 20D'), p('MATH 155A', 'MATH 20D'),
  p('MATH 155B', 'MATH 155A'),
  p('MATH 160A', 'MATH 109'), p('MATH 160B', 'MATH 160A'),
  p('MATH 163', 'MATH 20D'), p('MATH 170A', 'MATH 18', 'MATH 20C'),
  p('MATH 170B', 'MATH 170A'), p('MATH 170C', 'MATH 170B'),
  p('MATH 171A', 'MATH 18', 'MATH 20C'), p('MATH 171B', 'MATH 171A'),
  p('MATH 174', 'MATH 18', 'MATH 20C'), p('MATH 175', 'MATH 174'),
  p('MATH 180A', 'MATH 20C', 'MATH 18'), p('MATH 180B', 'MATH 180A'),
  p('MATH 180C', 'MATH 180B'), p('MATH 181A', 'MATH 180A'),
  p('MATH 181B', 'MATH 181A'), p('MATH 183', 'MATH 180A'),
  p('MATH 184', 'MATH 180A'), p('MATH 185', 'MATH 180A'),
  p('MATH 187A', 'MATH 18', 'MATH 20C'), p('MATH 187B', 'MATH 187A'),
  p('MATH 189', 'MATH 18', 'MATH 20C'),
])

// ── PHYS ──────────────────────────────────────────────────────────────────
const PHYS = Object.fromEntries([
  p('PHYS 1A', 'MATH 10A'), p('PHYS 1B', 'PHYS 1A', 'MATH 10B'),
  p('PHYS 1C', 'PHYS 1B', 'MATH 10C'),
  p('PHYS 1AL', 'PHYS 1A'), p('PHYS 1BL', 'PHYS 1B'), p('PHYS 1CL', 'PHYS 1C'),
  p('PHYS 2A', 'MATH 20A'), p('PHYS 2B', 'PHYS 2A', 'MATH 20B'),
  p('PHYS 2C', 'PHYS 2B', 'MATH 20C'), p('PHYS 2D', 'PHYS 2C'),
  p('PHYS 2BL', 'PHYS 2B'), p('PHYS 2CL', 'PHYS 2C'), p('PHYS 2DL', 'PHYS 2D'),
  p('PHYS 4A'), p('PHYS 4B', 'PHYS 4A'), p('PHYS 4C', 'PHYS 4B'),
  p('PHYS 4D', 'PHYS 4C'), p('PHYS 4E', 'PHYS 4D'),
  p('PHYS 100A', 'PHYS 2D', 'MATH 20D', 'MATH 18'),
  p('PHYS 100B', 'PHYS 100A'), p('PHYS 100C', 'PHYS 100B'),
  p('PHYS 105A', 'PHYS 2A', 'MATH 20D', 'MATH 18'),
  p('PHYS 105B', 'PHYS 105A'),
  p('PHYS 110A', 'PHYS 2D', 'MATH 20D'), p('PHYS 110B', 'PHYS 110A'),
  p('PHYS 111', 'PHYS 110A'),
  p('PHYS 120', 'PHYS 2D', 'MATH 20D'),
  p('PHYS 130', 'PHYS 100A', 'PHYS 110A'),
  p('PHYS 140A', 'PHYS 120'), p('PHYS 140B', 'PHYS 140A'),
  p('PHYS 152', 'PHYS 110A'), p('PHYS 160', 'PHYS 2D'),
  p('PHYS 161', 'PHYS 160'), p('PHYS 162', 'PHYS 161'),
  p('PHYS 163', 'PHYS 110A'),
  p('PHYS 170', 'PHYS 110A'), p('PHYS 171', 'PHYS 170'),
  p('PHYS 173', 'PHYS 100B', 'PHYS 110A'),
])

// ── ECE ───────────────────────────────────────────────────────────────────
const ECE = Object.fromEntries([
  p('ECE 15'), p('ECE 16', 'ECE 15'),
  p('ECE 25'), p('ECE 35', 'MATH 20C', 'PHYS 2B'),
  p('ECE 45', 'MATH 20D', 'ECE 35'), p('ECE 65', 'ECE 25', 'ECE 35'),
  p('ECE 100', 'ECE 45'), p('ECE 101', 'ECE 45'),
  p('ECE 102', 'ECE 100'), p('ECE 103', 'ECE 100'),
  p('ECE 107', 'MATH 20E', 'PHYS 2C'), p('ECE 109', 'MATH 20C'),
  p('ECE 110', 'ECE 101'), p('ECE 111', 'ECE 25', 'ECE 65'),
  p('ECE 115', 'ECE 111'), p('ECE 118', 'ECE 111'),
  p('ECE 120', 'ECE 101'), p('ECE 121', 'ECE 101'),
  p('ECE 123', 'ECE 101'), p('ECE 124', 'ECE 107'),
  p('ECE 125', 'ECE 107'), p('ECE 128', 'ECE 107'),
  p('ECE 134', 'ECE 100'), p('ECE 135', 'ECE 100'),
  p('ECE 136', 'ECE 100'),
  p('ECE 140A', 'ECE 15'), p('ECE 140B', 'ECE 140A'),
  p('ECE 141', 'ECE 140A'), p('ECE 143', 'ECE 16'),
  p('ECE 144', 'ECE 100'), p('ECE 148', 'ECE 16'),
  p('ECE 150', 'ECE 109'), p('ECE 155', 'ECE 100'),
  p('ECE 158A', 'ECE 101'), p('ECE 158B', 'ECE 158A'),
  p('ECE 161A', 'ECE 101'), p('ECE 161B', 'ECE 161A'), p('ECE 161C', 'ECE 161B'),
  p('ECE 163', 'ECE 101'), p('ECE 164', 'ECE 161A'),
  p('ECE 165', 'ECE 107'), p('ECE 166', 'ECE 107'),
  p('ECE 171A', 'ECE 101'), p('ECE 171B', 'ECE 171A'),
  p('ECE 172A', 'ECE 101'), p('ECE 174', 'MATH 18', 'ECE 109'),
  p('ECE 175A', 'ECE 109', 'MATH 18'), p('ECE 175B', 'ECE 175A'),
  p('ECE 176', 'ECE 175A'), p('ECE 180', 'ECE 109'),
  p('ECE 181', 'ECE 107'), p('ECE 182', 'ECE 107'),
  p('ECE 183', 'ECE 100'), p('ECE 184', 'ECE 101'),
  p('ECE 185', 'ECE 101'), p('ECE 187', 'ECE 101'),
])

// ── DSC ───────────────────────────────────────────────────────────────────
const DSC = Object.fromEntries([
  p('DSC 10'), p('DSC 20', 'DSC 10'), p('DSC 30', 'DSC 20'),
  p('DSC 40A', 'DSC 10', 'MATH 20C'), p('DSC 40B', 'DSC 20', 'DSC 40A'),
  p('DSC 80', 'DSC 30', 'DSC 40A'), p('DSC 95'),
  p('DSC 100', 'DSC 80', 'DSC 40B'), p('DSC 102', 'DSC 100'),
  p('DSC 106', 'DSC 80'), p('DSC 120', 'DSC 80'),
  p('DSC 140A', 'DSC 80', 'DSC 40B', 'MATH 18'),
  p('DSC 140B', 'DSC 140A'), p('DSC 148', 'DSC 80', 'DSC 40B'),
  p('DSC 167', 'DSC 80'), p('DSC 170', 'DSC 80'),
  p('DSC 180A', 'DSC 80', 'DSC 40B'), p('DSC 180B', 'DSC 180A'),
  p('DSC 190'),
])

// ── CHEM ──────────────────────────────────────────────────────────────────
const CHEM = Object.fromEntries([
  p('CHEM 4'), p('CHEM 6A'), p('CHEM 6B', 'CHEM 6A'), p('CHEM 6C', 'CHEM 6B'),
  p('CHEM 6AH'), p('CHEM 6BH', 'CHEM 6AH'), p('CHEM 6CH', 'CHEM 6BH'),
  p('CHEM 7L', 'CHEM 6A'), p('CHEM 7LM', 'CHEM 6B'),
  p('CHEM 40A', 'CHEM 6C'), p('CHEM 40B', 'CHEM 40A'), p('CHEM 40C', 'CHEM 40B'),
  p('CHEM 40AH', 'CHEM 6C'), p('CHEM 40BH', 'CHEM 40AH'), p('CHEM 40CH', 'CHEM 40BH'),
  p('CHEM 43A', 'CHEM 6C'), p('CHEM 43B', 'CHEM 43A'),
  p('CHEM 100A', 'CHEM 6C', 'MATH 20B', 'PHYS 2A'),
  p('CHEM 100B', 'CHEM 100A', 'MATH 20C'),
  p('CHEM 100C', 'CHEM 100B'),
  p('CHEM 105A', 'CHEM 100A'), p('CHEM 105B', 'CHEM 105A'),
  p('CHEM 108', 'CHEM 6C'), p('CHEM 109', 'CHEM 6C'),
  p('CHEM 114A', 'CHEM 40C'), p('CHEM 114B', 'CHEM 114A'),
  p('CHEM 114C', 'CHEM 114B'), p('CHEM 114D', 'CHEM 114C'),
  p('CHEM 120A', 'CHEM 6C'), p('CHEM 120B', 'CHEM 120A'),
  p('CHEM 126', 'CHEM 100A'), p('CHEM 127', 'CHEM 100A'),
  p('CHEM 130', 'CHEM 6C'), p('CHEM 131', 'CHEM 130'),
  p('CHEM 132', 'CHEM 131'),
  p('CHEM 140A', 'CHEM 40B'), p('CHEM 140B', 'CHEM 140A'),
  p('CHEM 140C', 'CHEM 140B'),
  p('CHEM 143A', 'CHEM 40B'), p('CHEM 143B', 'CHEM 143A'),
  p('CHEM 143C', 'CHEM 143B'),
  p('CHEM 150', 'CHEM 40C'), p('CHEM 155', 'CHEM 40C'),
  p('CHEM 164', 'CHEM 100B'), p('CHEM 165', 'CHEM 100B'),
  p('CHEM 167', 'CHEM 100B'),
])

// ── BIO ───────────────────────────────────────────────────────────────────
const BIO = Object.fromEntries([
  p('BILD 1'), p('BILD 2'), p('BILD 3'), p('BILD 4', 'BILD 1'),
  p('BILD 7', 'BILD 1'), p('BILD 10'),
  p('BICD 100', 'BILD 1'), p('BICD 110', 'BICD 100'),
  p('BICD 120', 'BICD 100'), p('BICD 130', 'BICD 100'),
  p('BICD 140', 'BICD 100'),
  p('BIBC 100', 'BILD 1', 'CHEM 6C'), p('BIBC 102', 'BIBC 100'),
  p('BIBC 103', 'BIBC 100'), p('BIBC 110', 'BIBC 100'),
  p('BIBC 120', 'BIBC 100'),
  p('BIPN 100', 'BILD 1', 'BILD 2'), p('BIPN 102', 'BIPN 100'),
  p('BIPN 105', 'BIPN 100'), p('BIPN 106', 'BIPN 100'),
  p('BIPN 108', 'BIPN 100'), p('BIPN 140', 'BIPN 100'),
  p('BIPN 142', 'BIPN 100'),
  p('BIMM 100', 'BICD 100'), p('BIMM 101', 'BIMM 100'),
  p('BIMM 110', 'BIMM 100'), p('BIMM 112', 'BIMM 100'),
  p('BIMM 114', 'BIMM 100'), p('BIMM 120', 'BIMM 100'),
  p('BIMM 121', 'BIMM 100'), p('BIMM 122', 'BIMM 100'),
  p('BIMM 130', 'BICD 100'),
  p('BIEB 100', 'BILD 3'), p('BIEB 102', 'BILD 3'),
  p('BIEB 110', 'BILD 3'), p('BIEB 120', 'BILD 3'),
  p('BIEB 121', 'BIEB 120'), p('BIEB 126', 'BILD 3'),
  p('BIEB 128', 'BILD 3'), p('BIEB 130', 'BILD 3'),
  p('BIEB 132', 'BILD 3'), p('BIEB 140', 'BILD 3'),
  p('BIEB 150', 'BILD 3'),
])

// ── ECON ──────────────────────────────────────────────────────────────────
const ECON = Object.fromEntries([
  p('ECON 1'), p('ECON 2'), p('ECON 3'), p('ECON 4'),
  p('ECON 100A', 'ECON 1', 'MATH 20A'), p('ECON 100B', 'ECON 100A', 'MATH 20B'),
  p('ECON 100C', 'ECON 100B', 'MATH 20C'),
  p('ECON 110A', 'ECON 3', 'MATH 20A'), p('ECON 110B', 'ECON 110A', 'MATH 20B'),
  p('ECON 120A', 'ECON 1', 'MATH 20A'), p('ECON 120B', 'ECON 120A', 'MATH 20B'),
  p('ECON 120C', 'ECON 120B'),
  p('ECON 130', 'ECON 100B'), p('ECON 131', 'ECON 100B'),
  p('ECON 135', 'ECON 100B'), p('ECON 138', 'ECON 120B'),
  p('ECON 140', 'ECON 100B'), p('ECON 142', 'ECON 100B'),
  p('ECON 150', 'ECON 100B'), p('ECON 155', 'ECON 110B'),
  p('ECON 160', 'ECON 100B'), p('ECON 170', 'ECON 100A'),
  p('ECON 171', 'ECON 100A'), p('ECON 172A', 'ECON 100A', 'ECON 120A'),
  p('ECON 172B', 'ECON 172A'), p('ECON 173A', 'ECON 100A'),
  p('ECON 173B', 'ECON 173A'), p('ECON 175', 'ECON 110B'),
  p('ECON 178', 'ECON 120B'), p('ECON 180', 'ECON 100A'),
])

// ── COGS ──────────────────────────────────────────────────────────────────
const COGS = Object.fromEntries([
  p('COGS 1'), p('COGS 3'), p('COGS 9'), p('COGS 10'),
  p('COGS 14A'), p('COGS 14B', 'COGS 14A'),
  p('COGS 18'), p('COGS 17', 'COGS 14A'),
  p('COGS 100', 'COGS 1'), p('COGS 101A', 'COGS 1'),
  p('COGS 101B', 'COGS 1'), p('COGS 101C', 'COGS 1'),
  p('COGS 102A', 'COGS 14B'), p('COGS 102B', 'COGS 14B'),
  p('COGS 102C', 'COGS 14B'),
  p('COGS 107', 'COGS 14B'), p('COGS 108', 'COGS 18'),
  p('COGS 109', 'COGS 14B'), p('COGS 110', 'COGS 14B'),
  p('COGS 111', 'COGS 14B'),
  p('COGS 118A', 'COGS 18', 'MATH 18'), p('COGS 118B', 'COGS 118A'),
  p('COGS 118C', 'COGS 118A'), p('COGS 118D', 'COGS 118A'),
  p('COGS 119', 'COGS 18'), p('COGS 120', 'COGS 18'),
  p('COGS 121', 'COGS 120'), p('COGS 122', 'COGS 120'),
  p('COGS 123', 'COGS 18'), p('COGS 124', 'COGS 18'),
  p('COGS 125', 'COGS 18'),
  p('COGS 137', 'COGS 1'), p('COGS 138', 'COGS 108'),
  p('COGS 150', 'COGS 14B'), p('COGS 153', 'COGS 107'),
  p('COGS 155', 'COGS 14B'), p('COGS 160', 'COGS 1'),
  p('COGS 170', 'COGS 14B'), p('COGS 171', 'COGS 14B'),
  p('COGS 172', 'COGS 14B'),
  p('COGS 180', 'COGS 14B'), p('COGS 181', 'COGS 118A'),
  p('COGS 185', 'COGS 18'), p('COGS 187A', 'COGS 18'),
  p('COGS 187B', 'COGS 187A'),
  p('COGS 188', 'COGS 18'),
])

// ── MAE ───────────────────────────────────────────────────────────────────
const MAE = Object.fromEntries([
  p('MAE 2'), p('MAE 3', 'MATH 20D', 'PHYS 2A'),
  p('MAE 8'), p('MAE 11', 'PHYS 2A', 'MATH 20C'),
  p('MAE 20', 'CHEM 6A'), p('MAE 21', 'MAE 20'),
  p('MAE 30A', 'MAE 11'), p('MAE 30B', 'MAE 30A'),
  p('MAE 101A', 'MAE 3'), p('MAE 101B', 'MAE 101A'),
  p('MAE 101C', 'MAE 101B'),
  p('MAE 104', 'MAE 3'), p('MAE 105', 'MAE 3'),
  p('MAE 107', 'MATH 20D'), p('MAE 108', 'MATH 20C'),
  p('MAE 110A', 'MAE 101A'), p('MAE 110B', 'MAE 110A'),
  p('MAE 113', 'MAE 105'), p('MAE 119', 'MAE 101A'),
  p('MAE 120', 'MAE 30B'), p('MAE 121', 'MAE 120'),
  p('MAE 130A', 'MAE 3'), p('MAE 130B', 'MAE 130A'),
  p('MAE 131A', 'MAE 130A'), p('MAE 131B', 'MAE 131A'),
  p('MAE 140', 'MAE 3'), p('MAE 142', 'MAE 140'),
  p('MAE 143A', 'MAE 140'), p('MAE 143B', 'MAE 143A'),
  p('MAE 150', 'MAE 3'), p('MAE 155', 'MAE 11'),
  p('MAE 160', 'MAE 3'), p('MAE 165', 'MAE 3'),
  p('MAE 170', 'MAE 3'), p('MAE 171A', 'MAE 170'), p('MAE 171B', 'MAE 171A'),
])

// ── POLI ──────────────────────────────────────────────────────────────────
const POLI = Object.fromEntries([
  p('POLI 5'), p('POLI 10'), p('POLI 11'), p('POLI 12'), p('POLI 13'),
  p('POLI 27'), p('POLI 28', 'POLI 27'), p('POLI 30', 'POLI 27'),
  p('POLI 100', 'POLI 10'), p('POLI 100A', 'POLI 10'),
  p('POLI 104A', 'POLI 10'), p('POLI 104B', 'POLI 104A'),
  p('POLI 110', 'POLI 11'), p('POLI 112', 'POLI 11'),
  p('POLI 113', 'POLI 11'),
  p('POLI 120A', 'POLI 12'), p('POLI 120B', 'POLI 120A'),
  p('POLI 120C', 'POLI 12'), p('POLI 120D', 'POLI 12'),
  p('POLI 130', 'POLI 13'), p('POLI 131', 'POLI 13'),
  p('POLI 140', 'POLI 12'), p('POLI 150', 'POLI 30'),
])

// ── PSYC ──────────────────────────────────────────────────────────────────
const PSYC = Object.fromEntries([
  p('PSYC 1'), p('PSYC 2'), p('PSYC 3'), p('PSYC 4'),
  p('PSYC 60', 'PSYC 1'), p('PSYC 70', 'PSYC 60'),
  p('PSYC 100', 'PSYC 1'), p('PSYC 101', 'PSYC 2'),
  p('PSYC 102', 'PSYC 2'), p('PSYC 104', 'PSYC 2'),
  p('PSYC 105', 'PSYC 2'), p('PSYC 106', 'PSYC 2'),
  p('PSYC 108', 'PSYC 2'), p('PSYC 120', 'PSYC 2'),
  p('PSYC 133', 'PSYC 1'), p('PSYC 134', 'PSYC 1'),
  p('PSYC 135', 'PSYC 60'), p('PSYC 138', 'PSYC 60'),
  p('PSYC 139', 'PSYC 60'), p('PSYC 140', 'PSYC 60'),
  p('PSYC 141', 'PSYC 60'), p('PSYC 142', 'PSYC 60'),
  p('PSYC 143', 'PSYC 60'), p('PSYC 150', 'PSYC 60'),
  p('PSYC 154', 'PSYC 60'), p('PSYC 155', 'PSYC 60'),
  p('PSYC 159', 'PSYC 60'), p('PSYC 160', 'PSYC 60'),
  p('PSYC 161', 'PSYC 60'), p('PSYC 162', 'PSYC 60'),
  p('PSYC 163', 'PSYC 60'), p('PSYC 164', 'PSYC 60'),
  p('PSYC 170', 'PSYC 60'), p('PSYC 171', 'PSYC 60'),
  p('PSYC 181', 'PSYC 70'), p('PSYC 182', 'PSYC 70'),
  p('PSYC 190', 'PSYC 70'),
])

// ── Merge all ─────────────────────────────────────────────────────────────

export const PREREQ_GRAPH: PrereqGraph = {
  ...CSE, ...MATH, ...PHYS, ...ECE, ...DSC, ...CHEM, ...BIO, ...ECON, ...COGS, ...MAE, ...POLI, ...PSYC,
}

// ── Graph utility functions ──────────────────────────────────────────────

export function getUnlocks(courseId: string): string[] {
  return Object.values(PREREQ_GRAPH)
    .filter(n => n.prereqs.includes(courseId))
    .map(n => n.id)
}

export function getDepth(courseId: string, visited = new Set<string>()): number {
  if (visited.has(courseId)) return 0
  visited.add(courseId)
  const node = PREREQ_GRAPH[courseId]
  if (!node || node.prereqs.length === 0) return 0
  return 1 + Math.max(...node.prereqs.map(p => getDepth(p, visited)))
}

export function canTake(courseId: string, completed: Set<string>): boolean {
  const node = PREREQ_GRAPH[courseId]
  if (!node) return true
  return node.prereqs.every(p => completed.has(p))
}

export type CourseStatus = 'completed' | 'available' | 'locked'
export function getCourseStatus(courseId: string, completed: Set<string>): CourseStatus {
  if (completed.has(courseId)) return 'completed'
  if (canTake(courseId, completed)) return 'available'
  return 'locked'
}

export function getAllDownstream(courseId: string): string[] {
  const result = new Set<string>()
  const queue = getUnlocks(courseId)
  while (queue.length) {
    const next = queue.pop()!
    if (result.has(next)) continue
    result.add(next)
    queue.push(...getUnlocks(next))
  }
  return Array.from(result).sort()
}
