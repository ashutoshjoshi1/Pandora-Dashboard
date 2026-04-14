/**
 * Default job templates for New Build and Repair workflows.
 * These will be attached as CardJob entries when a new build/repair card is created.
 * The user will provide the final job lists later — these are sensible placeholders
 * based on the Pandora instrument lifecycle.
 */

export const BUILD_JOBS = [
  "Intake & documentation",
  "Sensor head assembly",
  "Filter wheel assembly",
  "Spectrometer installation",
  "Fiber optic routing",
  "Enclosure build",
  "PC / electronics setup",
  "Wiring & connector crimps",
  "Pressure test",
  "Firmware / software load",
  "Lab alignment",
  "Roof test deployment",
  "Data quality check",
  "Pre-cal preparation",
  "Ship to GSFC / end user",
];

export const REPAIR_JOBS = [
  "Intake & condition report",
  "Disassembly & inspection",
  "Identify faulty components",
  "Order replacement parts",
  "Component swap / repair",
  "Reassembly",
  "Pressure test",
  "Filter wheel check",
  "Lab alignment",
  "Roof test deployment",
  "Data quality check",
  "Final QA sign-off",
  "Ship to GSFC / end user",
];
