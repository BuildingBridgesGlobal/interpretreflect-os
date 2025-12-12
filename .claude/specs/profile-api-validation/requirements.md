# Requirements Document: Profile API Input Validation & Edge Case Handling

## Introduction

This document defines the requirements for adding comprehensive input validation and edge case handling to the Community Profile API (`/api/community/profile` route). The API currently lacks robust validation for user inputs, which poses security risks (SQL injection, XSS) and data integrity concerns. These requirements address input validation gaps, type safety issues, security vulnerabilities, and business logic enforcement identified through test coverage analysis.

The implementation will add validation using a schema validation library (e.g., Zod), sanitize user inputs, use parameterized queries, and enforce business rules on data constraints.

---

## Requirements

### Requirement 1: Enum Field Validation

**User Story:** As a system administrator, I want the API to reject invalid enum values, so that data integrity is maintained and the database only contains valid status values.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request with `availability_status` THEN the system SHALL validate that the value is one of: 'available', 'limited', 'not_available', 'freelance_only', 'staff_only'.
2. IF `availability_status` contains an invalid value THEN the system SHALL return a 400 Bad Request response with an error message specifying the allowed values.
3. WHEN `availability_status` is not provided in a POST request THEN the system SHALL use 'available' as the default value.
4. WHEN `availability_status` is not provided in a PUT request THEN the system SHALL not modify the existing value.

---

### Requirement 2: Year Field Validation

**User Story:** As a system administrator, I want graduation years to be validated as reasonable year values, so that invalid or nonsensical dates are not stored in the system.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request with `graduation_year` THEN the system SHALL validate that the value is a number between 1900 and (current year + 5).
2. IF `graduation_year` is provided as a string that can be parsed as a valid number THEN the system SHALL convert it to a number before validation.
3. IF `graduation_year` is provided as a non-numeric string or is outside the valid range THEN the system SHALL return a 400 Bad Request response with an appropriate error message.
4. WHEN `graduation_year` is null or undefined THEN the system SHALL accept the value without validation.

---

### Requirement 3: URL Field Validation

**User Story:** As a system administrator, I want URL fields to be validated, so that only properly formatted URLs are stored in user profiles.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request with `website_url` THEN the system SHALL validate that the value is a properly formatted URL (must start with http:// or https://).
2. WHEN a user submits a POST or PUT request with `linkedin_url` THEN the system SHALL validate that the value is a properly formatted URL and optionally validate it contains 'linkedin.com'.
3. IF `website_url` or `linkedin_url` contains an invalid URL format THEN the system SHALL return a 400 Bad Request response with an error message identifying the invalid field.
4. WHEN `website_url` or `linkedin_url` is null, undefined, or an empty string THEN the system SHALL accept the value without URL format validation.

---

### Requirement 4: Display Name Length Validation

**User Story:** As a user, I want clear feedback when my display name is too short or too long, so that I can provide an appropriate name for my profile.

#### Acceptance Criteria

1. WHEN a user submits a POST request with `display_name` THEN the system SHALL validate that the value has a minimum length of 2 characters.
2. WHEN a user submits a POST or PUT request with `display_name` THEN the system SHALL validate that the value has a maximum length of 100 characters.
3. IF `display_name` is less than 2 characters THEN the system SHALL return a 400 Bad Request response with an error message stating the minimum length requirement.
4. IF `display_name` exceeds 100 characters THEN the system SHALL return a 400 Bad Request response with an error message stating the maximum length requirement.
5. WHEN `display_name` contains only whitespace characters THEN the system SHALL treat it as invalid and return a 400 Bad Request response.

---

### Requirement 5: XSS Sanitization for Text Fields

**User Story:** As a security engineer, I want all text inputs to be sanitized, so that malicious scripts cannot be injected into the system and executed in other users' browsers.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request THEN the system SHALL sanitize the following text fields for XSS: `display_name`, `bio`, `headline`, `professional_background`, `education`, `itp_program`, `current_employer`, `location_city`, `location_state`, `location_country`.
2. WHEN sanitizing text fields THEN the system SHALL remove or encode HTML tags and JavaScript event handlers.
3. WHEN sanitizing text fields THEN the system SHALL preserve legitimate text content including special characters that are not XSS vectors.
4. IF a text field contains script tags or event handlers THEN the system SHALL strip them before storing the data.

---

### Requirement 6: Array Field Constraints

**User Story:** As a system administrator, I want array fields to have reasonable limits, so that users cannot create profiles with excessive data that impacts system performance.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request with array fields THEN the system SHALL validate that the following arrays do not exceed their maximum length:
   - `interpreter_certifications` / `certifications`: maximum 20 items
   - `languages_worked`: maximum 20 items
   - `settings_work_in` / `specialties`: maximum 20 items
   - `offer_support_in` / `strong_domains`: maximum 20 items
   - `seeking_guidance_in` / `weak_domains`: maximum 20 items
   - `work_settings`: maximum 20 items
2. IF an array field exceeds its maximum length THEN the system SHALL return a 400 Bad Request response with an error message specifying the field name and maximum allowed items.
3. WHEN array fields are provided THEN the system SHALL validate that each element is a string.
4. IF an array field contains non-string elements THEN the system SHALL return a 400 Bad Request response.
5. WHEN array fields are provided THEN the system SHALL remove duplicate entries before storing.
6. WHEN individual array elements are provided THEN the system SHALL validate that each string element does not exceed 200 characters.

---

### Requirement 7: Profile Existence Check for PUT

**User Story:** As a user, I want clear feedback when trying to update a non-existent profile, so that I know to create a profile first.

#### Acceptance Criteria

1. WHEN a user submits a PUT request THEN the system SHALL first verify that a profile exists for the authenticated user.
2. IF no profile exists for the user THEN the system SHALL return a 404 Not Found response with an error message indicating the profile does not exist.
3. WHEN a profile exists THEN the system SHALL proceed with the update operation.

---

### Requirement 8: Bidirectional Legacy Field Synchronization

**User Story:** As a developer, I want the certifications field to sync bidirectionally, so that data remains consistent regardless of which field name is used.

#### Acceptance Criteria

1. WHEN a user submits a PUT request with `certifications` field THEN the system SHALL also update `interpreter_certifications` with the same value.
2. WHEN a user submits a PUT request with `interpreter_certifications` field THEN the system SHALL also update `certifications` with the same value (existing behavior).
3. IF both `certifications` and `interpreter_certifications` are provided in the same request THEN the system SHALL use `interpreter_certifications` value for both fields.

---

### Requirement 9: SQL Injection Prevention

**User Story:** As a security engineer, I want the API to use parameterized queries, so that SQL injection attacks are prevented.

#### Acceptance Criteria

1. WHEN the GET method queries for connections THEN the system SHALL use parameterized queries instead of string interpolation in the `.or()` clause.
2. WHEN building database queries with user-provided IDs THEN the system SHALL use Supabase's built-in parameterization or filter methods that prevent injection.
3. WHEN validating `view_user_id` query parameter THEN the system SHALL verify it is a valid UUID format before using it in queries.

---

### Requirement 10: Runtime Type Validation

**User Story:** As a developer, I want runtime type checking on all inputs, so that type mismatches are caught early and do not cause unexpected behavior.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request THEN the system SHALL validate that boolean fields (`is_deaf_interpreter`, `open_to_mentoring`, `looking_for_mentor`, `is_searchable`, `show_location`, `show_employer`) are boolean types.
2. WHEN a user submits a POST or PUT request THEN the system SHALL validate that numeric fields (`years_experience`, `graduation_year`) are number types or valid numeric strings.
3. WHEN a user submits a POST or PUT request THEN the system SHALL validate that string fields are string types.
4. IF a field has an incorrect type THEN the system SHALL return a 400 Bad Request response with an error message specifying the expected type.
5. WHEN a boolean field is provided as a string 'true' or 'false' THEN the system SHALL convert it to the appropriate boolean value.

---

### Requirement 11: Timezone Validation

**User Story:** As a user, I want my timezone to be validated, so that only valid timezone identifiers are stored in my profile.

#### Acceptance Criteria

1. WHEN a user submits a POST or PUT request with `timezone` THEN the system SHALL validate that the value is a valid IANA timezone identifier (e.g., 'America/New_York', 'Europe/London').
2. IF `timezone` contains an invalid timezone identifier THEN the system SHALL return a 400 Bad Request response with an error message.
3. WHEN `timezone` is null, undefined, or an empty string THEN the system SHALL accept the value without timezone validation.

---

### Requirement 12: Comprehensive Error Response Format

**User Story:** As an API consumer, I want consistent and detailed error responses, so that I can programmatically handle validation errors and provide meaningful feedback to users.

#### Acceptance Criteria

1. WHEN validation fails THEN the system SHALL return a 400 Bad Request response with a JSON body containing:
   - `error`: A human-readable summary of the validation failure
   - `details`: An array of specific field-level errors
2. WHEN multiple validation errors occur THEN the system SHALL return all errors in a single response rather than failing on the first error.
3. WHEN a field-level error occurs THEN the error object SHALL include:
   - `field`: The name of the field that failed validation
   - `message`: A description of the validation failure
   - `received`: The value that was received (for debugging, excluding sensitive data)
4. WHEN sanitization modifies a value THEN the system SHALL NOT return an error but SHALL store the sanitized value.

---

## Non-Functional Requirements

### NFR-1: Performance

1. WHEN validating input THEN the system SHALL complete validation within 50ms for typical payloads.
2. WHEN sanitizing text fields THEN the system SHALL not significantly impact API response time (less than 10ms additional latency).

### NFR-2: Security

1. The system SHALL log validation failures for security monitoring purposes (without logging sensitive user data).
2. The system SHALL implement rate limiting awareness to prevent validation-based denial of service attacks.

### NFR-3: Maintainability

1. The validation logic SHALL be implemented using a schema validation library (e.g., Zod) for type safety and maintainability.
2. The validation schemas SHALL be defined separately from route handlers for reusability and testing.

### NFR-4: Backward Compatibility

1. The system SHALL maintain backward compatibility with existing valid API requests.
2. WHEN new validation is added THEN previously accepted valid values SHALL continue to be accepted.

---

## Out of Scope

- Rate limiting implementation (mentioned but not required for this feature)
- Pagination for connections/posts counts
- Real-time validation feedback (client-side)
- Database schema changes
- Migration of existing invalid data
