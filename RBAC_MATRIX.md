# RBAC Matrix

EditorialFlow uses a rigid Role-Based Access Control (RBAC) system.

| Action | Author | Editor | Admin |
| :--- | :---: | :---: | :---: |
| **Login** | ✅ | ✅ | ✅ |
| **View Dashboard** | ✅ | ✅ | ✅ |
| **Create Draft** | ✅ | ✅ | ✅ |
| **Edit Own Draft** | ✅ | ✅ | ✅ |
| **Edit Any Draft** | ❌ | ✅ | ✅ |
| **Submit for Review** | ✅ | ✅ | ✅ |
| **Review Article** | ❌ | ✅ | ✅ |
| **Publish Article** | ❌ | ✅ | ✅ |
| **Reject Article** | ❌ | ✅ | ✅ |
| **Delete Article** | ❌ | ❌ | ✅ |
| **Manage Users** | ❌ | ❌ | ✅ |
| **View Audit Logs** | ❌ | ✅ | ✅ |
