Auth.requireLogin();

// Tanggal lokal (YYYY-MM-DD). toISOString() memakai UTC sehingga bisa mundur 1 hari.
function localDateString(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class MonthChangeStrategy {
    constructor(planner) {
        this.planner = planner
    }
    changeMonth() {
        throw "changeMonth method should be implemented"
    }
}

class NextMonthStrategy extends MonthChangeStrategy {
    changeMonth() {
        this.planner.monthIndex = (this.planner.monthIndex + 1) % 12;
        this.planner.displayCalendar();
        const selectedDay = document.querySelector(".calendar-day.selected")?.dataset?.date;
        TaskForm.updateToDoList(this.planner, selectedDay);
    }
}

class PreviousMonthStrategy extends MonthChangeStrategy {
    changeMonth() {
        this.planner.monthIndex = (this.planner.monthIndex - 1 + 12) % 12;
        this.planner.displayCalendar();
        const selectedDay = document.querySelector(".calendar-day.selected")?.dataset?.date;
        TaskForm.updateToDoList(this.planner, selectedDay);
    }
}

class Task {
    constructor(id, date, title, description, time) {
        this.id = id;
        this.date = date;
        this.title = title;
        this.description = description;
        this.time = time;
    }
}

// Data task sekarang disimpan di database lewat REST API (bukan localStorage lagi).
class TaskManager {
    constructor() {
        this.tasks = [];
    }

    async loadTasks() {
        const rows = await Api.get('/tasks');
        this.tasks = rows.map(t => new Task(t.id, t.date, t.title, t.description, t.time));
        this.sortTasks();
    }

    async addTask(date, title, description, time) {
        const saved = await Api.post('/tasks', { date, title, description, time });
        this.tasks.push(new Task(saved.id, saved.date, saved.title, saved.description, saved.time));
        this.sortTasks();
        alert(`Task added for ${date}: ${title}`);
    }

    async updateTask(task, title, description, time) {
        const saved = await Api.put(`/tasks/${task.id}`, { title, description, time });
        task.title = saved.title;
        task.description = saved.description;
        task.time = saved.time;
        this.sortTasks();
    }

    async deleteTask(task) {
        await Api.delete(`/tasks/${task.id}`);
        this.tasks = this.tasks.filter(t => t.id !== task.id);
    }

    sortTasks() {
        for (let i = 0; i < this.tasks.length - 1; i++) {
            for (let j = 0; j < this.tasks.length - 1 - i; j++) {
                const date_1 = new Date(`${this.tasks[j].date} ${this.tasks[j].time}`);
                const date_2 = new Date(`${this.tasks[j + 1].date} ${this.tasks[j + 1].time}`);

                if (date_1 > date_2) {
                    const temp = this.tasks[j];
                    this.tasks[j] = this.tasks[j + 1];
                    this.tasks[j + 1] = temp;
                }
            }
        }
    }

    getTasksForDate(date) {
        return this.tasks.filter(task => task.date === date);
    }
}

class MonthPlanner {
    constructor(year, monthIndex) {
        this.year = year ;
        this.monthIndex = monthIndex;
        this.selectedDate = null;
        this.images = [
    "./images/1.jpg",
    "./images/2.jpg",
    "./images/3.jpg",
    "./images/4.jpg",
    "./images/5.jpg",
    "./images/6.jpg",
    "./images/7.jpg",
    "./images/8.jpg",
    "./images/9.png",
    "./images/10.jpg",
    "./images/11.jpg",
    "./images/12.jpg"
];
        this.monthNamesKanji = ["いちがつ", "にがつ", "さんがつ", "しがつ", "ごがつ", "ろくがつ", "しちがつ", "はちがつ", "くがつ", "じゅうがつ", "じゅういちがつ", "じゅうにがつ"];
        this.monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        this.kanjiDays = ["Sun 日曜日", "Mon 月曜日", "Tue 火曜日", "Wed 水曜日", "Thu 木曜日", "Fri 金曜日", "Sat 土曜日"];
        this.quotes = [
            "Believe in yourself. Walk your path.<br/>— Porco Rosso, 1992.",
            "Inspiration unlocks the future.<br/>— The Wind Rises, 2013.",
            "May all your bacon burn.<br/>— Howl's Moving Castle, 2014.",
            "Once you've met someone you never really forget them.<br/>— Spirited Away, 2011.",
            "The Earth speaks to all of us, and if we listen, we can understand.<br/>— Castle In The Sky, 1986.",
            "You cannot alter your fate. However you can rise to meet it.<br/>— Princess Mononoke, 1997.",
            "Try Laughing. Then whatever scares you will go away.<br/>— My Neighbor Totoro, 1988.",
            "Just follow your heart and keep smiling.<br/>— Kiki's Delivery Service, 1989.",
            "It’s nice, isn’t it? Your dream will come true.<br/>— Whisper of the Heart, 1995.",
            "My mother, father and I are all borrowers.<br/>— The Secret World of Arietty, 2010.",
            "Life is a winking light in the darkness.<br/>— Grave of the Fireflies, 1988.",
            "I’m not afraid of you. I’ve got Cup Ramen on my side.<br/>— Ponyo, 2008.",
        ];
        this.daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        this.MonthChangeStrategy = null;
        this.taskManager = new TaskManager();
    }

    setMonthChangeStrategy(strategy) {
        this.monthChangeStrategy = strategy;
    }

    changeMonth() {
        this.monthChangeStrategy.changeMonth();
    }

    displayCalendar() {
        let calendarContainer = document.getElementById("calendar");
        let monthNameKanji = document.getElementById("monthNameKanji");
        let monthName = document.getElementById("monthName");
        let quote = document.getElementById("quote")
        let image = document.getElementById("image-container");

        monthNameKanji.textContent = this.monthNamesKanji[this.monthIndex];
        monthName.textContent = this.monthNames[this.monthIndex];
        image.src = this.images[this.monthIndex]
        quote.innerHTML = this.quotes[this.monthIndex];
        
        let firstDayOfMonth = new Date(this.year, this.monthIndex, 1).getDay();
        let numDays = this.daysInMonth[this.monthIndex];

        let calendarHTML = "<tr class='calendar-header'>";
        this.kanjiDays.forEach(day => {
            calendarHTML += `<td>${day}</td>`;
        });
        calendarHTML += "</tr><tr>";

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHTML += "<td></td>";
        }

        for (let day = 1; day <= numDays; day++) {
            let formattedDate = `${this.year}-${String(this.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let hasTask = this.taskManager.getTasksForDate(formattedDate).length > 0 ? "has-task" : "";
            let selected = formattedDate === this.selectedDate ? "selected" : "";

            if ((firstDayOfMonth + day - 1) % 7 === 0 && day !== 1) {
                calendarHTML += "</tr><tr>";
            }
            calendarHTML += `<td class="calendar-day ${hasTask} ${selected}" data-day="${day}" data-date="${formattedDate}">${day}</td>`;
        }
        calendarContainer.innerHTML = calendarHTML;
    }
}

class TaskValidator {
    static validateTaskInputs(title, time) {
        if (!title || !time) {
            throw new Error("Input cannot be empty.");
        }
    }

    static checkDuplicateTask(planner, selectedDate, time, isEditMode, currentEditTask) {
        let existingTasks = planner.taskManager.getTasksForDate(selectedDate);
        for (let task of existingTasks) {
            if (isEditMode && currentEditTask && task === currentEditTask) {
                continue
            }
            if (time.slice(0, 5) === task.time.slice(0, 5)) {
                throw new Error(`A task already exists at ${time}. Please input a different time.`);
            }
        }
    }
}

// Menyegarkan tampilan sesuai halaman yang sedang dibuka
function refreshView(planner) {
    if (document.getElementById("calendar")) {
        planner.displayCalendar();
    }
    if (document.getElementById("todayTasksContainer")) {
        new TodayTasks(planner).showTodaysTasks(localDateString());
    }
}

class TaskForm {
    static isEditMode = false;
    static currentEditTask = null;

    static openForm(day) {
        document.getElementById("taskForm").style.display = "flex";
        const displayDate = TaskForm.isEditMode ? TaskForm.currentEditTask.date : day;
        document.getElementById("selectedDate").textContent = displayDate;
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDescription").value = "";
        document.getElementById("taskTime").value = "";
    }
    
    static closeForm() {
        TaskForm.isEditMode = false;
        TaskForm.currentEditTask = null;
        document.getElementById("taskForm").style.display = "none";
    }

    static async saveTask(planner, selectedDate) {
        try {
            const title = document.getElementById("taskTitle").value;
            const description = document.getElementById("taskDescription").value;
            const time = document.getElementById("taskTime").value;
            const taskDate = document.getElementById("selectedDate").textContent;

            TaskValidator.validateTaskInputs(title, time);

            if (TaskForm.isEditMode && TaskForm.currentEditTask) {
                await this.handleEditTask(planner, taskDate, title, description, time);
            } else {
                await this.handleCreateTask(planner, selectedDate, title, description, time);
            }

            TaskForm.closeForm();
            TaskForm.updateToDoList(planner, taskDate);
            refreshView(planner);
        } catch (error) {
            alert(error.message);
        }
    }

    static async handleCreateTask(planner, selectedDate, title, description, time) {
        TaskValidator.checkDuplicateTask(planner, selectedDate, time, false, null);
        await planner.taskManager.addTask(selectedDate, title, description, time);
    }

    static async handleEditTask(planner, selectedDate, title, description, time) {
        const task = TaskForm.currentEditTask;
        TaskValidator.checkDuplicateTask(planner, task.date, time, true, task);

        await planner.taskManager.updateTask(task, title, description, time);
        alert(`Task "${title}" has been edited.`);
    }

    static updateToDoList(planner, selectedDate) {
        const todoItems = document.getElementById("todoItems");
        if (todoItems){
            todoItems.innerHTML = '';
            if (selectedDate) {
                const tasksForDay = planner.taskManager.getTasksForDate(selectedDate);
    
                if (tasksForDay.length > 0) {
                    tasksForDay.forEach(task => {
                        const taskItem = document.createElement("li");
                        const label = document.createElement("span");
                        label.className = "task-title";
                        label.textContent = `${task.time} - ${task.title}: ${task.description}`;
                        taskItem.appendChild(label);
    
                        taskItem.addEventListener("click", () => {
                            TaskForm.showTaskOptions(taskItem, task, selectedDate);
                        });
    
                        todoItems.appendChild(taskItem);
                    });
                }
            }
        }
    }

    static showTaskOptions(taskItem, task, selectedDate) {
        if (!taskItem.querySelector(".task-options")) {  
            const taskOptions = document.createElement("div");
            taskOptions.classList.add("task-options");
            
            taskOptions.innerHTML = `
                <div class="edit-delete">
                    <button class="edit-button"><i class="fas fa-edit"></i></button>
                    <button class="delete-button"><i class="fas fa-trash"></i></button>
                </div>
            `;

            taskItem.appendChild(taskOptions);

            taskOptions.querySelector(".edit-button").onclick = (e) => {
                e.stopPropagation();
                TaskEditor.editTask(planner, task);
                taskOptions.remove();
            };

            taskOptions.querySelector(".delete-button").onclick = (e) => {
                e.stopPropagation();
                TaskRemoval.removeTask(planner, task);
                taskOptions.remove();
            };
        }
    }
}


class TaskRemoval {
    static async removeTask(planner, task) {
        try {
            await planner.taskManager.deleteTask(task);
        } catch (error) {
            alert(error.message);
            return;
        }

        refreshView(planner);
        TaskForm.updateToDoList(planner, task.date);
    }
}

class TaskEditor {
    static editTask(planner, task) {
        document.getElementById("selectedDate").textContent = task.date;
        document.getElementById("taskTitle").value = task.title;
        document.getElementById("taskDescription").value = task.description;
        document.getElementById("taskTime").value = task.time;
        document.getElementById("taskForm").style.display = "flex";

        TaskForm.isEditMode = true;
        TaskForm.currentEditTask = task;
    }
}

class TaskSearch {
    constructor(planner) {
        this.planner = planner;
    }

    searchTasks(keyword) {
        const results = [];
        const lowerKeyWord = keyword.toLowerCase();
    
        for (let i = 0; i < this.planner.taskManager.tasks.length; i++) {
            const task = this.planner.taskManager.tasks[i];
            if (task.title.toLowerCase().includes(lowerKeyWord) || task.description.toLowerCase().includes(lowerKeyWord)) {
                results.push(task);
            }
        }
        return results;
    }

    updateSearchResults(keyword) {
        const searchItems = document.getElementById("searchResults");
        searchItems.innerHTML = '';

        if (!keyword.trim()) { 
            searchItems.style.display = "none";
            return;
        }

        const searchResults = this.searchTasks(keyword);

        if (searchResults.length > 0) {
            searchResults.forEach(task => {
                const taskItem = document.createElement("li");
                taskItem.textContent = `${task.date} || ${task.time} - ${task.title}: ${task.description}`;
                searchItems.appendChild(taskItem);
            });
            searchItems.style.display = "block";
        } 
        else {
            searchItems.style.display = "none";
        }
    }
}

class TodayTasks {
    constructor(planner) {
        this.planner = planner;
    }

    showTodaysTasks(date) { 
        const todayTasksContainer = document.getElementById("todayTasksContainer");
        const tasks = this.planner.taskManager.getTasksForDate(date);
        const todayTasksList = document.createElement("ul");

        todayTasksContainer.innerHTML = "";

        if (tasks.length > 0) {
            tasks.forEach(task => {
                const taskItem = document.createElement("li");
                taskItem.textContent = `${task.time} || ${task.title}: ${task.description}`;
                todayTasksList.appendChild(taskItem);
                taskItem.addEventListener("click", () => {
                    TaskForm.showTaskOptions(taskItem, task, task.date);
                });
            });
        } else {
            const emptytask = document.createElement("p");
            emptytask.textContent = "No tasks for today.";
            emptytask.classList.add("no-tasks-message")
            todayTasksContainer.appendChild(emptytask);
        }

        todayTasksContainer.appendChild(todayTasksList);
    }
}

class TaskReminder {
    static checkReminders(planner) {
        let now = new Date(); 

        planner.taskManager.tasks.forEach(task => {
            let taskDateTime = new Date(`${task.date}T${task.time}:00`);
            if (now.getFullYear() === taskDateTime.getFullYear() &&
                now.getMonth() === taskDateTime.getMonth() &&
                now.getDate() === taskDateTime.getDate() &&
                now.getHours() === taskDateTime.getHours() &&
                now.getMinutes() === taskDateTime.getMinutes()) {

                alert(`You have a task : "${task.title}" to do now!`);
            }
        });
    }
}

function nextMonth() {
    planner.setMonthChangeStrategy(new NextMonthStrategy(planner));
    planner.changeMonth();
}

function previousMonth() {
    planner.setMonthChangeStrategy(new PreviousMonthStrategy(planner));
    planner.changeMonth();
}

function openTaskForm() {
    try {
        const selectedDay = document.querySelector(".calendar-day.selected")?.dataset?.date;
        if (!selectedDay) {
            throw new Error("Please select a date first!");}
        else {
            TaskForm.openForm(selectedDay);
        }
    } catch (error) {
        alert(error.message);}
}

function saveTask() {
    const selectedDay = document.querySelector(".calendar-day.selected")?.dataset?.date;
    TaskForm.saveTask(planner, selectedDay);
}

function cancelTask() {
    TaskForm.closeForm();
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('calendar-day')) {
        const days = document.querySelectorAll('.calendar-day');
        days.forEach(day => day.classList.remove('selected'));
        e.target.classList.add('selected'); 
        
        const selectedDate = e.target.dataset.date;
        planner.selectedDate = selectedDate;
        TaskForm.updateToDoList(planner, selectedDate); 
    }
});

const planner = new MonthPlanner(2025, 0);
const taskSearch = new TaskSearch(planner)

async function initApp() {
    if (!Auth.isLoggedIn()) return;

    const navUser = document.getElementById('navUser');
    if (navUser) navUser.textContent = Auth.getUser()?.username || '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) { 
            taskSearch.updateSearchResults(e.target.value); 
        });
    }

    try {
        await planner.taskManager.loadTasks();
    } catch (error) {
        alert(error.message);
    }
    refreshView(planner);
}

document.addEventListener('DOMContentLoaded', initApp);

setInterval(() => {
    TaskReminder.checkReminders(planner)
}, 60000)
