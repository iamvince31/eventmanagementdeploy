# System Requirement Specification
## Event Management System

**Version:** 1.0  
**Date:** February 11, 2026  
**Project:** Event Management System for CVSU  
**Document Status:** Final

---

## 1. Overview

### 1.1 Purpose
The Event Management System is a web-based application designed to streamline the process of creating, managing, and organizing events within Cavite State University (CVSU). The system enables users to create events, invite members from different departments, manage event details, and track member participation.

### 1.2 Product Description
A full-stack web application that provides:
- User authentication and authorization
- Event creation and management
- Member invitation system with department filtering
- Event image gallery with drag-and-drop upload
- Calendar view for event scheduling
- Real-time member availability tracking
- Responsive design for multiple devices

### 1.3 Intended Audience
- **Primary Users:** CVSU faculty, staff, and administrators
- **Secondary Users:** Department coordinators and event organizers
- **System Administrators:** IT staff responsible for system maintenance

### 1.4 Document Conventions
- **Must/Shall:** Mandatory requirement
- **Should:** Recommended requirement
- **May:** Optional requirement
- **API:** Application Programming Interface
- **UI:** User Interface
- **CRUD:** Create, Read, Update, Delete

---

## 2. Scope

### 2.1 In Scope

#### Core Features:
1. **User Management**
   - User registration with CVSU email validation
   - Secure login/logout functionality
   - Department-based user organization
   - User profile management

2. **Event Management**
   - Create, edit, and delete events
   - Event details: title, description, location, date, time
   - Multiple image uploads per event
   - Open/closed event settings
   - Host-only edit permissions

3. **Member Invitation System**
   - Department-based filtering
   - Search functionality for members
   - Multi-select member invitation
   - Real-time member selection count

4. **Calendar & Scheduling**
   - Calendar view of all events
   - Date-based event filtering
   - Event timeline visualization

5. **Image Management**
   - Drag-and-drop image upload
   - Multiple images per event
   - Image preview and removal
   - Horizontal scrolling gallery

### 2.2 Out of Scope

The following features are NOT included in the current version:

1. **Email Notifications**
   - Automated email invitations
   - Event reminder emails
   - Notification system

2. **Advanced Features**
   - Event attendance tracking
   - QR code check-in system
   - Event analytics and reporting
   - Export functionality (PDF, Excel)

3. **Social Features**
   - Event comments/discussions
   - Event ratings and reviews
   - Social media integration

4. **Payment Integration**
   - Paid events
   - Ticket sales
   - Payment processing

5. **Mobile Applications**
   - Native iOS app
   - Native Android app
   - Progressive Web App (PWA)

6. **Advanced Calendar Features**
   - Recurring events
   - Event reminders
   - Calendar synchronization (Google Calendar, Outlook)

---

## 3. Limitations

### 3.1 Technical Limitations

1. **File Upload**
   - Maximum image size: 2MB per file
   - Supported formats: JPEG, PNG, JPG, GIF only
   - No video or document uploads

2. **Performance**
   - Designed for up to 1,000 concurrent users
   - Database optimized for up to 10,000 events
   - Image storage limited by server capacity

3. **Browser Support**
   - Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - No Internet Explorer support
   - JavaScript must be enabled

4. **Email Validation**
   - Restricted to CVSU email format: `main.firstname.lastname@cvsu.edu.ph`
   - No external email domains allowed

### 3.2 Functional Limitations

1. **User Roles**
   - Single user role (no admin/moderator distinction)
   - All users have equal permissions except event ownership

2. **Event Capacity**
   - No maximum attendee limit enforcement
   - No waitlist functionality

3. **Search & Filter**
   - Basic text search only
   - No advanced search operators
   - No saved search filters

4. **Data Export**
   - No built-in export functionality
   - Manual data extraction required

### 3.3 Security Limitations

1. **Authentication**
   - No multi-factor authentication (MFA)
   - No OAuth/SSO integration
   - Basic password requirements only

2. **Access Control**
   - No granular permission system
   - No 