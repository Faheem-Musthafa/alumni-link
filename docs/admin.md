# 🧑‍💼 Admin Context – CampusLink

## 🎯 Overview

The **Admin** module in **CampusLink** ensures the platform remains secure, verified, and trustworthy by managing user authentication and verification processes. Admins oversee the approval of students and alumni accounts by reviewing uploaded identification documents, maintaining platform integrity, and managing institutional data.

---

## 🧠 Purpose

Admins act as the **central authority** responsible for verifying identities and maintaining the authenticity of all users in the CampusLink ecosystem. The system relies on admin validation to create a safe space for mentorship, communication, and career growth.

---

## 👤 Admin Responsibilities

* **ID Verification:** Review and validate student/alumni ID cards or official proof documents.
* **User Approval:** Approve, reject, or hold accounts pending verification.
* **Role Management:** Assign, modify, or revoke user roles (Student, Alumni, Aspirant).
* **Data Oversight:** Monitor activity logs, mentorship requests, and user engagement.
* **Content Moderation:** Handle reported content, fake profiles, or inappropriate activity.
* **Institutional Reports:** Generate usage reports for internal analytics.

---

## 🧩 Key Features

### 1. Verification Dashboard

* Displays pending verification requests with ID previews.
* Admin can approve or reject profiles based on document authenticity.
* Approved users receive verified badges and full access.

### 2. Role Management

* Assign roles using Firebase custom claims.
* Manage access permissions for Students, Alumni, and Aspirants.

### 3. User Management

* Search, view, and filter users by department, year, or verification status.
* Ability to deactivate or delete accounts.

### 4. Reports & Insights

* Track user growth, mentorship activity, and referral posts.
* Export data for institutional review.

---

## ⚙️ Technical Implementation

### Data Flow:

```
User Registration → Upload ID → Pending Verification → Admin Review → Approval → Role Activation
```

### Firebase Integration:

* **Firestore:** Stores user records and verification requests.
* **Storage:** Holds uploaded ID documents.
* **Auth:** Manages login and role claims.
* **Functions:** Automates notification to Admin when new verification requests are submitted.

### Example Data Structure:

```plaintext
firestore/
 ├── users/
 │   ├── userID/
 │   │   ├── name: "Ananya Singh"
 │   │   ├── role: "student"
 │   │   ├── verified: true
 │   │   ├── idCardUrl: "https://firebase..."
 │   │   ├── department: "CSE"
 │   │   └── college: "XYZ Institute"
 │
 └── pending_verifications/
     ├── requestID/
     │   ├── userID: "..."
     │   ├── idCardUrl: "https://firebase..."
     │   ├── submittedAt: "2025-11-04"
     │   └── status: "pending"
```

---

## 🔐 Access Permissions

| Action                  | Student | Alumni | Aspirant | Admin |
| ----------------------- | ------- | ------ | -------- | ----- |
| Upload ID               | ✅       | ✅      | ❌        | ❌     |
| Approve/Reject Users    | ❌       | ❌      | ❌        | ✅     |
| Manage Roles            | ❌       | ❌      | ❌        | ✅     |
| Post Jobs               | ❌       | ✅      | ❌        | ❌     |
| Send Mentorship Request | ✅       | ❌      | ✅        | ❌     |
| Access Dashboard        | ❌       | ❌      | ❌        | ✅     |

---

## 🧾 Outcome

The Admin module ensures CampusLink remains a **verified and institutionally trusted mentorship platform**. By implementing ID verification and strict access control, it upholds the authenticity and credibility of all user interactions.

---

**File:** `Admin.md`
**Project:** CampusLink
**Version:** 1.0
**Maintainer:** CampusLink Development Team
