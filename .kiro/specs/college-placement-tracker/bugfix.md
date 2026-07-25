# Bugfix Requirements Document

## Introduction

The College Placement Drive & Student Application Tracker (SIH 2026) contains several known correctness issues identified during architecture review. These issues span data integrity, ML pipeline robustness, authentication token lifecycle, and application state consistency. Left unaddressed, they cause incorrect predictions, silent data corruption, constraint violations, and security gaps. This document captures the current defective behaviors, the expected correct behaviors, and the existing behaviors that must be preserved.

---

## Bug Analysis

### Current Behavior (Defect)

**Data Quality & Null Handling**

1.1 WHEN a student record has a NULL or missing `cgpa` value THEN the system passes the NULL value directly into the ML pipeline, causing the prediction model to crash or produce an undefined label

1.2 WHEN a student record has a NULL or missing `cgpa` value THEN the system stores the record without rejection or warning, violating the implicit non-null constraint needed for eligibility filtering

1.3 WHEN an `applications` row has `stage = applied` or `stage = rejected` THEN the system leaves downstream fields (`offer_status`, `package`) as NULL without treating them as valid terminal states, causing aggregation queries to silently exclude those rows from placement statistics

1.4 WHEN an application is in-progress (stage = interview or stage = shortlisted) THEN the system stores a NULL `package` value and the dashboard KPI for average package incorrectly includes or excludes those rows depending on query construction, producing an inconsistent placement rate

**Duplicate & Identity Resolution**

1.5 WHEN two students share the same `full_name` THEN the system has no enforced mechanism to distinguish them other than `student_id`, and any query or UI component that filters or displays by name ambiguously returns multiple rows without clear disambiguation

1.6 WHEN a duplicate student name is displayed in the admin panel THEN the system shows both rows with identical display names, making it impossible for a placement officer to identify the correct student without additional context

**Unique Constraint on Applications**

1.7 WHEN a student attempts to apply to the same placement drive more than once THEN the system does not enforce the `UNIQUE(student_id, drive_id)` constraint at the application layer before reaching the database, causing an unhandled constraint violation error to surface as an unformatted 500 response to the client

**JWT Token Revocation**

1.8 WHEN a user logs out or their account is deactivated THEN the system does not invalidate the existing JWT access token, allowing the token to remain valid until its natural expiry (up to 30 minutes), creating a window of unauthorized access

1.9 WHEN a refresh token stored in an httpOnly cookie is used after the user's account is deactivated THEN the system issues a new access token without checking current account status, extending the unauthorized access window beyond the refresh token's 7-day lifetime

**Incomplete Application Rows**

1.10 WHEN an application row is created with `stage = applied` THEN the system inserts the row with `offer_status`, `package`, and `prediction_label` all as NULL, and subsequent reads treat these NULLs as missing data rather than valid initial states, causing frontend components to render undefined values

1.11 WHEN the ML microservice is unavailable or returns an error THEN the system stores NULL in `applications.prediction_label` without recording the failure, making it impossible to distinguish between "not yet predicted" and "prediction failed" states

---

### Expected Behavior (Correct)

**Data Quality & Null Handling**

2.1 WHEN a student record has a NULL or missing `cgpa` value THEN the system SHALL reject the ML prediction request with a validation error and return a clear message indicating that `cgpa` is required for prediction, without crashing the pipeline

2.2 WHEN a student record has a NULL or missing `cgpa` value THEN the system SHALL enforce a NOT NULL constraint (or a checked default) on `students.cgpa` at the database layer and return a 400 validation error from the API when attempting to create or update such a record

2.3 WHEN an `applications` row has `stage = applied` or `stage = rejected` THEN the system SHALL treat NULL `offer_status` and NULL `package` as valid sentinel values for those terminal/initial states and include them correctly in aggregation queries using COALESCE or explicit NULL-aware logic

2.4 WHEN computing dashboard KPIs for average package or placement rate THEN the system SHALL explicitly filter to only rows where `offer_status = selected` or `offer_status = offer_accepted`, excluding in-progress and rejected rows from package calculations

**Duplicate & Identity Resolution**

2.5 WHEN two students share the same `full_name` THEN the system SHALL display a disambiguating identifier (such as `roll_number` or `student_id` suffix) alongside the name in all admin panel views and dropdown selectors

2.6 WHEN a placement officer searches for a student by name THEN the system SHALL return all matching records with their unique `roll_number` visible, allowing unambiguous selection

**Unique Constraint on Applications**

2.7 WHEN a student attempts to apply to the same placement drive more than once THEN the system SHALL check for an existing `(student_id, drive_id)` pair at the application service layer before issuing the INSERT, and return a 409 Conflict response with a descriptive error message

**JWT Token Revocation**

2.8 WHEN a user logs out THEN the system SHALL add the current JWT access token's `jti` claim to a token denylist (stored in Redis or the database) and reject any subsequent request bearing that token, even if it has not expired

2.9 WHEN a user's account is deactivated THEN the system SHALL invalidate all active refresh tokens for that user by clearing or revoking the stored refresh token records, and SHALL check account active status on every refresh token exchange before issuing a new access token

**Incomplete Application Rows**

2.10 WHEN an application row is created with `stage = applied` THEN the system SHALL insert the row with `offer_status = pending` as the explicit default rather than NULL, ensuring frontend components always receive a defined status value

2.11 WHEN the ML microservice is unavailable or returns an error THEN the system SHALL store `prediction_label = 'error'` (or a designated sentinel string) in `applications.prediction_label` and SHALL log the failure to `prediction_history` with a `model_version` of `'unavailable'`, enabling operators to identify and rerun failed predictions

---

### Unchanged Behavior (Regression Prevention)

**Data Quality & Null Handling**

3.1 WHEN a student record has a valid numeric `cgpa` between 0.0 and 10.0 THEN the system SHALL CONTINUE TO pass `cgpa` to the ML pipeline and return a prediction label without modification

3.2 WHEN an application has `stage = offer` and `offer_status = selected` with a non-null `package` THEN the system SHALL CONTINUE TO include that record in placement rate and average package KPI calculations

**Duplicate & Identity Resolution**

3.3 WHEN a student has a unique `full_name` with no duplicates THEN the system SHALL CONTINUE TO display the name without any additional disambiguating suffix in student-facing views

**Unique Constraint on Applications**

3.4 WHEN a student applies to a placement drive for the first time THEN the system SHALL CONTINUE TO create the application record and return a 201 Created response with the new application object

**JWT Token Lifecycle**

3.5 WHEN a valid, non-revoked JWT access token is presented within its expiry window by an active user THEN the system SHALL CONTINUE TO authenticate the request and return the requested resource

3.6 WHEN a valid refresh token is presented by an active user whose access token has expired THEN the system SHALL CONTINUE TO issue a new access token without requiring re-login

**Incomplete Application Rows**

3.7 WHEN an application advances through stages (applied → shortlisted → interview → offer) THEN the system SHALL CONTINUE TO update only the relevant fields for each stage transition and preserve previously set fields

3.8 WHEN the ML microservice is available and returns a valid prediction THEN the system SHALL CONTINUE TO store the `prediction_label` and `confidence` in both `applications` and `prediction_history` as before

**General API Behavior**

3.9 WHEN any authenticated API endpoint is called with a valid token and well-formed request body THEN the system SHALL CONTINUE TO return the correct HTTP status code and response shape as defined in the API contract

3.10 WHEN the RBAC middleware evaluates a request from a student role THEN the system SHALL CONTINUE TO scope all data access to that student's own `student_id`, preventing cross-student data leakage
