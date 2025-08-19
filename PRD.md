# Product Requirements Document: Desktop Activity Tracker

## 1. Introduction & Vision

This document outlines the requirements for a desktop application designed to monitor and record user activity. The primary goal is to provide users with insights into how they spend their time on their computers, focusing on application usage, browser activity, and filesystem changes.

## 2. Target Audience

*   **Productivity Enthusiasts:** Individuals who want to track their digital habits to optimize their focus and efficiency.
*   **Freelancers & Professionals:** People who need to track time spent on different applications and websites for billing or personal review.
*   **Developers & Power Users:** Users who want to monitor file changes for specific projects or directories.
*   **General Users:** Anyone curious about their computer usage patterns and looking to understand them better.

## 3. Features

### 3.1. Core Tracking Capabilities

#### 3.1.1. Active Application Tracking
*   **Description:** The system must be able to identify and record the application that is currently in the foreground.
*   **Requirements:**
    *   Detect the name of the active application (e.g., "Google Chrome", "Visual Studio Code").
    *   Log the timestamp when the application becomes active.
    *   Calculate the duration the application remains in the foreground.

#### 3.1.2. Browser Tab Tracking
*   **Description:** When a supported web browser is the active application, the system must track details about the currently active tab.
*   **Supported Browsers (Initial):**
    *   Google Chrome
*   **Requirements:**
    *   Get the URL of the active tab.
    *   Get the title of the active tab.
    *   Log timestamps for tab switches to calculate time spent on each page.

#### 3.1.3. Filesystem Activity Tracking
*   **Description:** The system will monitor and log changes to the filesystem, such as file creation, deletion, and modification.
*   **Requirements:**
    *   Log the path of the file that was changed.
    *   Log the type of change (e.g., created, deleted, modified).
    *   Log the timestamp of the event.
    *   Provide a mechanism for users to specify directories to exclude from tracking to ensure privacy and reduce noise (e.g., system folders, cache directories).

### 3.2. User Interface

*   **Real-time Activity View:** A simple dashboard that displays the currently active application and tab information, along with recent file changes.
*   **Historical Log:** A chronological view of all recorded activities, allowing users to scroll through their history.
*   **Configuration/Settings:** A settings panel where users can configure tracked directories and exclusions.
*   **Data Visualization:** Basic charts summarizing time spent on different applications and websites for the day.

### 3.3. Data Storage

*   **Local Storage:** All activity data will be stored locally on the user's machine in a structured format. Data privacy is paramount, and data should not leave the user's machine in the initial version.

## 4. Success Metrics

*   **Accuracy:** The application accurately detects and records application, tab, and filesystem changes within a few seconds of the event.
*   **Performance:** The application consumes minimal system resources during background operation.
*   **Stability:** The application runs continuously without crashing.

## 5. Out of Scope for Version 1.0

*   **Advanced Data Analysis:** Complex analytics, reporting, and trend analysis are reserved for future versions.
*   **File Content Indexing:** The system will log that a file has changed, but it will not store the content of the file.
*   **Application/Website Blocking:** The application will only monitor activity; it will not have features to block or limit usage.
*   **Keystroke and Mouse Logging:** To protect user privacy, the app will not record keystrokes or mouse movements.
*   **Cloud Sync:** There will be no cloud-based data synchronization in the initial version.
*   **Broad Browser Support:** Support for a wide range of browsers (e.g., Firefox, Safari, Edge) will be considered for future releases. The initial version will focus on a single browser to ensure a stable launch.
