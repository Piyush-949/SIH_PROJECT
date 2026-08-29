## 2026-08-26T10:06:42Z
You are a Specification Miner for KRISHI FLOW (SIH 2026 Problem Statement ID: 26032).
Your working directory is: C:\Users\piyus\Desktop\SIH_PROJECT\.agents\spec_miner_survey_1
Source of Truth: C:\Users\piyus\Desktop\SIH_PROJECT\ORIGINAL_REQUEST.md

You MUST read C:\Users\piyus\Desktop\SIH_PROJECT\ORIGINAL_REQUEST.md thoroughly before starting.
Your task is to conduct a complete, forensic requirement extraction across:
1. Requirements R1 through R7 and all Acceptance Criteria.
2. Complete data schema entities, required fields, relationships, enums, and audit fields (User, FarmerProfile, ProcurementCentre, Crop, CentreCrop, Slot, Booking, QueueEntry, ProcurementRecord, QualityInspection, Payment, OperationalIncident, Notification).
3. Exact mathematical and algorithmic models:
   - Processing time formula: Base Time + Quantity Factor + Crop Complexity + Inspection Time + Delay Penalty
   - AI Centre recommendation formula with >= 5 weighted factors (distance, queue length, wait time, capacity, processing speed, crop availability, equipment status, historical delay rate) and explainability ("Why we recommend this")
   - Weighing discrepancy alert logic (>20% difference)
   - Quality inspection matrix: Grade (A/B/C), Moisture %, Foreign Material %, Damaged Grain %, decisions (Accept, Partial Accept, Reject, Reinspect)
   - Payment state machine and SLA boost logic
4. User workflows for all 6 roles (FARMER, CENTRE_OPERATOR, QUALITY_INSPECTOR, DISTRICT_ADMIN, STATE_ADMIN, SUPER_ADMIN).
5. Small vs Large quantity farmer bifurcation (self-transport slot vs PACS team visit request workflow).
6. Demo flow verification requirements (under 5 minutes).

Write your comprehensive findings to C:\Users\piyus\Desktop\SIH_PROJECT\.agents\spec_miner_survey_1\spec_analysis.md and write a self-contained handoff.md in your directory. Update progress.md with your liveness heartbeat. Send a message to parent when done.
