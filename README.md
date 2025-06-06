[中文 (Read in Chinese)](README_zh.md)

# Task Management Kanban Board

A full-featured task management application that supports a Kanban board view, calendar view, and task reminder functionality.



![Kanban Board 截图](/assets/image.png) 

![Kanban Board 截图](/assets/image2.png)



## Features

### Core Features

- **Task Management**: Create, edit, and delete tasks.
- **Kanban View**: Organize tasks into "To Do," "In Progress," and "Done" columns.
- **Drag & Drop**: Change task status by dragging and dropping.
- **Subtask System**: Add subtasks to tasks and track their progress.
- **Calendar View**: View task distribution by date.
- **Task Reminders**: Set due date reminders (requires browser notification permission).

### Task Attributes

- Title, Description, Due Date
- Priority (High/Medium/Low)
- Custom Tags (with support for tag colors)
- Status (To Do/In Progress/Done)

### Advanced Features

- **Dark/Light Theme**: Switch themes with a single click.
- **Multi-panel Mode Switching**: Freely switch between the Kanban board and subtask panels.
- **Search & Filter**: Filter tasks by keyword, status, priority, and tags.
- **Calendar View**: See task distribution by date.
- **Task Reminders**: Set reminders for task deadlines.
- **Subtask Management**: Add, edit, and delete subtasks, and track their progress.
- **Data Import/Export**: Easily back up and migrate data.
- **Responsive Design**: Adapts to mobile devices.
- **Local Storage**: All data is saved using `localStorage`.
- **Task Progress Bar**: Intuitively displays the completion status of subtasks.

## How to Use

### Basic Operations

1. **Add a Task**: Click the "+" button at the top of a column.
2. **Edit a Task**: Click the "⋮" menu on a task card > "Edit".
3. **Delete a Task**: Click the "⋮" menu on a task card > "Delete".
4. **Move a Task**: Drag a task to a different status column.
5. **Add a Subtask**: Expand a task card > add in the input field.

### View Switching

- Use the left navigation bar to switch views:
  - **Kanban View**: The default view.
  - **Calendar View**: See task distribution by month.
  - **Filtered View**: View tasks by individual status (To Do/In Progress/Done).

### Advanced Features

- **Set a Reminder**: Choose a reminder time in the task editing form.
- **Use Tags**: Add comma-separated tags when editing a task.
- **Search Tasks**: Enter keywords in the search box on the left.
- **Switch Theme**: Click the "Switch Theme" button in the top-right corner.

## Technical Details

### File Structure

```
kanban-project/
├── index.html          # Main page
├── styles.css          # Stylesheet
├── assets/             # Assets folder
│   ├── image.png       # Example image
│   ├── image2.png      # Example image
│   └── README.md       # Project documentation
├── app.js              # Application logic
```

### Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Web Storage API (`localStorage`)

### Data Storage

All task data is stored in the browser's `localStorage` under the following keys:

- `kanban_tasks`: Task data
- `kanban_labels`: Label data
- `kanban_theme`: Theme preference
- `kanban_view`: View state

## Running Instructions

1. Clone or download the project.
2. Open `index.html` directly in your browser.
3. No server or additional dependencies are required.

> **Note**: Data is saved locally in your browser. Clearing your cache will result in data loss.

## Future Expansion

- Visualized statistics dashboard and analytical reports
- Advanced filtering and custom views
- Task attachments
- User login and multi-user collaboration
- Keyboard shortcuts and quick actions
