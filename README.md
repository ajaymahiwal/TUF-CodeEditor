# TUF's Code Editor

## Overview
TUF's Code Editor is a versatile platform for showcasing code submissions and their corresponding outputs. This project features two primary functionalities: code display and code submission.

## Features
- **Code Display:** Enables users to view submitted code snippets along with their outputs and relevant details.
- **Code Submission:** Provides a user-friendly interface for submitting new code snippets to be displayed on the platform.

## Technology Stack
- **Express JS:** Backend framework for handling server-side logic and routing.
- **Node.js:** Powers the backend server for processing requests and responses.
- **MySQL:** Database for storing submitted code snippets and associated metadata.
- **EJS (Embedded JavaScript):** Templating engine for generating dynamic HTML content.

### Additional Technologies
- **Redis:** Implemented for caching to enhance the performance and speed of the application.
  - *Features of Redis:*
    - Provides fast in-memory data storage and retrieval.
    - Enhances the overall performance of the application.
- **Judge0 API:** Utilized for executing submitted code and obtaining their outputs.
  - *Features of Judge0 API:*
    - Offers reliable and efficient code execution capabilities.
    - Supports multiple programming languages for code submission and evaluation.

## Project Limitation
The TUF's Code Editor project is subject to a limitation where the database size is restricted to 5 MB. This limitation arises due to the use of a free tier of an online cloud service for MySQL hosting. Upgrading to a higher tier will remove this constraint, allowing for increased database capacity and scalability.

## Note on Technology Choice
EJS (Embedded JavaScript) has been chosen as the templating engine for this project instead of React. While React is a powerful library for building interactive user interfaces, it's better suited for applications with complex user interactions and frequent UI updates. Since this project consists of only two pages and doesn't require extensive client-side manipulation, EJS was chosen for its simplicity and ease of integration with Express. This decision helps maintain a lightweight and efficient codebase, avoiding the unnecessary overhead and complexity of React for this straightforward application.