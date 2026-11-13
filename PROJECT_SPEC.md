# Ashraff Memorial Hospital (AMH), Kalmunai — HO & RHO Rotation System
## Official Engineering Specification & Clinical Architecture (`PROJECT_SPEC.md`)

---

### 1. Executive Summary & Clinical Governance
Ashraff Memorial Hospital (AMH), Kalmunai operates under the **Ministry of Health — Sri Lanka** to facilitate postgraduate medical training for Examination for Registration to Practise Medicine (ERPM) medical graduates. Allocating medical officers to House Officer (HO) rotations and subsequent Relief House Officer (RHO) rotations is high-stakes, time-sensitive, and strictly bound by official merit rankings and clinical section training constraints.

This platform enforces a mathematically verified, zero-clash allocation system designed specifically for AMH Kalmunai:
1. **Hospital Identity & Administrative Governance:**
   - **Hospital:** Ashraff Memorial Hospital (AMH), Kalmunai
   - **Supervision:** Ministry of Health — Sri Lanka
   - **Address:** Main Street (A4), Kalmunai 32300, Eastern Province
   - **Telephone:** `067 222 9496` / `067 222 2261` / `067 222 3261`
   - **Email:** `info@amhkalmunai.lk`
2. **Admin-First Intake Setup & Registration Gate:**
   - Administrators configure the active cohort first (Batch Title, Appointment Start Date, Total Headcount $N$, and Registration Status Toggle).
   - Doctor registration is strictly gated: if registration is closed, doctors receive an official AMH notice screen with administrative contact lines.
3. **Automatic 6-Month Rotation Milestone Dates:**
   - System automatically calculates and displays exact calendar dates:
     - **Appointment Start Date:** e.g., `16 Nov 2026`
     - **Section 1 (H1):** `Starts 16 Nov 2026` → `Ends 15 May 2027`
     - **Section 2 (H2):** `Starts 16 May 2027` → `Ends 15 Nov 2027`
     - **RHO Initial 3 Months:** `Starts 16 Nov 2027` → `Ends 15 Feb 2028`
     - **RHO Unit Term:** `Starts 16 Feb 2028`
4. **100% Intake-Wise Scoping:**
   - Every candidate, quota set, allocation result, and mutual swap is isolated by `intake_id`. The Admin can seamlessly switch between cohorts via the header intake selector.
5. **Native Mobile App Experience for Doctors (`/`):**
   - Zero website chrome (no web navbar or web footer).
   - Centered `max-w-md` mobile app frame on desktop and full edge-to-edge on mobile devices.
   - Sticky top bar with AMH emblem, intake badge, and merit rank pill.
   - 4 Fixed Bottom Navigation Tabs: `Home`, `Choices`, `Swaps`, `RHO & Help`.
   - Touch-friendly `min-h-[52px]` targets and PWA support via `manifest.json`.
6. **Zero Technical Jargon:**
   - All tech stack names, algorithm theory names, and mathematical equations are completely replaced with clean, professional clinical terms.

---

### 2. Core Domain Rules & Group Constraints

#### The 4 Core Specialties & Group Division
- **Medical Group (Group A):** `Medicine`, `Pediatrics`
- **Surgical Group (Group B):** `Surgery`, `Gyn & Obs`
*(Strict Rule: No sub-specialties like Orthopedics, ENT, Psychiatry, or Unit A/B/C splits in Stage 1 & Stage 2).*

#### Mandatory Pairing Rule (Forbidden Combinations)
- An HO **CANNOT** select `Medicine + Pediatrics` together (either order).
- An HO **CANNOT** select `Surgery + Gyn & Obs` together (either order).
- Every HO must complete **1 specialty from Group A** and **1 specialty from Group B** across the two 6-month halves (H1 & H2).
- Therefore, there are strictly **8 Valid Non-Repeating Pairs**:
  1. `Medicine -> Surgery` (Group A $\rightarrow$ Group B)
  2. `Surgery -> Medicine` (Group B $\rightarrow$ Group A)
  3. `Medicine -> Gyn & Obs` (Group A $\rightarrow$ Group B)
  4. `Gyn & Obs -> Medicine` (Group B $\rightarrow$ Group A)
  5. `Pediatrics -> Surgery` (Group A $\rightarrow$ Group B)
  6. `Surgery -> Pediatrics` (Group B $\rightarrow$ Group A)
  7. `Pediatrics -> Gyn & Obs` (Group A $\rightarrow$ Group B)
  8. `Gyn & Obs -> Pediatrics` (Group B $\rightarrow$ Group A)

#### Absolute Merit Order & Registration Flow
- **Self-Registration:** Students register directly on the portal by entering their Full Name, Official ERPM Merit Rank ($1 \dots N$), and a 4-Digit PIN.
- **Unique Constraint:** If a student tries to register a Merit Rank already claimed, registration is blocked with a prompt to log in with their PIN.
- **Admin Review:** Admin inspects the live registration roster in a review table, correcting or pruning entries prior to execution.
- Serial Dictatorship processes candidates strictly in merit order $1 \dots N$.

---

### 3. Student Preference Input (2-Tap UI) & Allocation Engine

#### Ultra-Simple 2-Tap Choice Selection UI
Students submit their **1st Choice**, **2nd Choice**, and **3rd Choice** through a guided card interface:
1. **Tap Half 1 (H1):** Select from `Medicine`, `Surgery`, `Pediatrics`, `Gyn & Obs`.
2. **Tap Half 2 (H2):** The UI automatically greys out and disables the same specialty and all same-group specialties:
   - Selecting `Medicine` (Group A) enables only `Surgery` and `Gyn & Obs` (Group B).
   - Selecting `Surgery` (Group B) enables only `Medicine` and `Pediatrics` (Group A).
   - Selecting `Pediatrics` (Group A) enables only `Surgery` and `Gyn & Obs` (Group B).
   - Selecting `Gyn & Obs` (Group B) enables only `Medicine` and `Pediatrics` (Group A).

#### Allocation Engine: "Granted vs. Available Alternatives"
When Admin clicks **"Generate Allocations"**:
- Evaluates candidates strictly from Merit Rank 1 to N.
- For each student:
  - Iterates their submitted choices (Choice 1, 2, 3).
  - If a choice is available in raw quota AND passes the **Bipartite Feasibility Lookahead**:
    - Assign immediately with `status = 'GRANTED'`.
    - Quota is decremented.
  - If **NONE** of the student's choices can be granted (e.g. slots filled by higher ranks):
    - Do **NOT** force-assign an arbitrary rotation.
    - Set `status = 'ALTERNATIVES_AVAILABLE'`.
    - Calculate and return `availableAlternatives`: the **exact list of remaining valid & feasible combinations** that currently have capacity and pass feasibility lookahead.
    - Attach audit reason: *"Requested choices filled by higher merit ranks. Feasible alternatives available to claim."*
- **Student Portal Display:**
  - `GRANTED`: Displays green **Confirmed Allocation Card** with assigned H1 and H2.
  - `ALTERNATIVES_AVAILABLE`: Displays amber **Action Required Card** with one-tap buttons for each remaining feasible alternative. Tapping claims the rotation immediately.

---

### 4. Dynamic Auto-Quota Calculator & Bipartite Balance Invariant

When Admin configures or reviews a batch of $N$ incoming HOs:
1. **Base Quota:** $\lfloor N / 4 \rfloor$ slots per specialty per half.
2. **Remainder Distribution:** Remainder $r = N \pmod 4$ slots are allocated by highest demand:
   - Priority 1: `Medicine`
   - Priority 2: `Surgery`
   - Priority 3: `Pediatrics`
   - Priority 4: `Gyn & Obs`
3. **Bipartite Balance Invariant:**
   $$\text{H1}[\text{Medicine}] + \text{H1}[\text{Pediatrics}] = \text{H2}[\text{Surgery}] + \text{H2}[\text{Gyn \& Obs}]$$
   $$\text{H1}[\text{Surgery}] + \text{H1}[\text{Gyn \& Obs}] = \text{H2}[\text{Medicine}] + \text{H2}[\text{Pediatrics}]$$
   $$\sum_{X} \text{H1}[X] = \sum_{X} \text{H2}[X] = N$$

---

### 5. Post-Allocation Mutual Swap Window
- Full-Year Swap: Both students swap both halves.
- Single-Half Swap: Students swap H1 only OR H2 only.
- **Validation Engine:** Automatically checks and blocks:
  - Any swap producing $\text{Specialty}(H1) = \text{Specialty}(H2)$ (duplicate specialty).
  - Any swap producing a forbidden combination: `Med + Ped` or `Surg + Gyn`.

---

### 6. Stage 2 (RHO 3-Month) & Stage 3 (RHO Unit Two-Sided Matching)
- **Stage 2:** Auto-detects completed HO pair (1 Group A + 1 Group B). Eligible set is strictly the remaining 1 Group A + 1 Group B specialty.
- **Stage 3:** Hospital units and consultants with slot capacities. Frictionless 4-digit PIN authentication for consultants. Merit-prioritized stable matching.
