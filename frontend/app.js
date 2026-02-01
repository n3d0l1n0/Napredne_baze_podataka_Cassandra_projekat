import * as ui from './UI/ui.js';
import { fetchData, sendData, getStudent } from './API/api.js';
import * as helpers from './helpers.js';

const appContainer = document.getElementById('app-container');

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function renderLoginForm() {
    clearContainer(appContainer);

    const title = document.createElement('h1');
    title.textContent = 'Prijava na Studentski Organizator';

    const form = document.createElement('form');
    form.id = 'login-form';

    const idGroup = document.createElement('div');
    idGroup.className = 'form-group';
    const idLabel = document.createElement('label');
    idLabel.htmlFor = 'student-id';
    idLabel.textContent = 'Broj Indeksa:';
    const idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.id = 'student-id';
    idInput.required = true;
    idGroup.append(idLabel, idInput);

    const passGroup = document.createElement('div');
    passGroup.className = 'form-group';
    const passLabel = document.createElement('label');
    passLabel.htmlFor = 'password';
    passLabel.textContent = 'Lozinka:';
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.id = 'password';
    passInput.required = true;
    passGroup.append(passLabel, passInput);

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Prijavi se';
    
    const errorMessage = document.createElement('p');
    errorMessage.id = 'error-message';

    form.append(idGroup, passGroup, submitButton, errorMessage);
    appContainer.append(title, form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const studentId = idInput.value;
        const password = passInput.value;
        const result = await sendData('/auth/login', 'POST', { studentId, password });

        if (result && result.studentID) {
            localStorage.setItem('student', JSON.stringify(result));
            renderMainApp(result);
        } else {
            errorMessage.textContent = 'Pogrešan broj indeksa ili lozinka.';
        }
    });
}

function renderMainApp(student) {
    clearContainer(appContainer);
    let currentView = 'daily';
    const studentId = student.studentID;

    const header = document.createElement('header');
    header.className = 'app-header';
    
    const title = document.createElement('h1');
    title.textContent = 'Moj planer';

    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    
    const studentSpan = document.createElement('span');
    studentSpan.textContent = `Prijavljen: ${student.fname} ${student.lname} (${studentId})`;
    
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Odjavi se';
    logoutButton.className = 'logout-btn';
    logoutButton.onclick = () => {
        localStorage.removeItem('student');
        renderLoginForm();
    };
    
    userInfo.append(studentSpan, logoutButton);
    header.append(title, userInfo);

    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';

    const filterContainer = document.createElement('div');
    filterContainer.id = 'filter-container';

    const filterBar = ui.createFilterBar(async (selectedType) => {
        clearContainer(contentDiv);
        if (selectedType === 'Sve') {
            await renderDailyView(contentDiv, studentId); 
        } else {
            await renderFilteredTasks(contentDiv, studentId, selectedType);
        }
    });
    filterContainer.appendChild(filterBar);

    const switcher = ui.createViewSwitcher(currentView, (view) => {
        currentView = view;
        renderContent();
    });

    appContainer.append(header, switcher, filterContainer, contentDiv);

    async function renderContent() {
        clearContainer(contentDiv);
        filterContainer.style.display = currentView === 'daily' ? 'block' : 'none';

        if (currentView === 'daily') {
            await renderDailyView(contentDiv, studentId);
        } else if (currentView === 'weekly') {
            await renderWeeklyView(contentDiv, studentId);
        } else if (currentView === 'archived') {
            await renderArchivedView(contentDiv, studentId);
        }
    }

    renderContent();
}

async function renderDailyView(container, studentId, currentFilter = 'Sve') {
    let tasks = await fetchData(`/students/${studentId}/tasks/daily/${helpers.getTodayDateStr()}`);
    
    if (currentFilter !== 'Sve') {
        tasks = tasks.filter(t => t.type === currentFilter);
    }

    const dailyContainer = document.createElement('div');
    dailyContainer.className = 'daily-view-container';

    const h2 = document.createElement('h2');
    h2.textContent = `Obaveze za danas (${helpers.formatDateSerbian(new Date())})`;
    dailyContainer.appendChild(h2);

    if (tasks.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'Nema obaveza za danas.';
        dailyContainer.appendChild(p);
    } else {
        tasks.forEach(task => {
            const taskEl = ui.createTaskItemElement(task, (t, c) => handleStatusChange(t, c, studentId));
            
            const advancedTools = ui.createTaskItemAdvanced(
                task, 
                studentId, 
                (sid, tid, title) => renderHistoryView(container, sid, tid, title),
                (t, sid) => archiveTaskAction(t, sid)
            );
            
            taskEl.appendChild(advancedTools);
            dailyContainer.appendChild(taskEl);
        });
    }

    container.append(dailyContainer, ui.createAddTaskForm((e, f) => handleFormSubmit(e, f, studentId, currentFilter)));
}

async function renderWeeklyView(container, studentId) {
    const startOfWeek = helpers.getStartOfWeek(new Date());
    const tasks = await fetchData(`/students/${studentId}/tasks/weekly/${helpers.formatDateForApi(startOfWeek)}`);
    const weeklyContainer = document.createElement('div');
    weeklyContainer.className = 'weekly-view-container';

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        weeklyContainer.appendChild(createWeeklyDayCell(currentDate, tasks, studentId));
    }
    container.appendChild(weeklyContainer);
}

function createWeeklyDayCell(date, allTasks, studentId) {
    const dateStr = date.toLocaleDateString('en-CA');
    const tasksForDay = allTasks.filter(t => new Date(t.taskTime).toLocaleDateString('en-CA') === dateStr);
    
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    const header = document.createElement('div');
    header.className = 'day-header';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = date.toLocaleDateString('sr-Latn-RS', { weekday: 'long' });
    
    const dateSpan = document.createElement('span');
    dateSpan.className = 'date';
    dateSpan.textContent = ` (${helpers.formatDateSerbian(date).slice(0, 5)})`;

    header.append(nameSpan, dateSpan);
    cell.appendChild(header);

    tasksForDay.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-in-week ${task.status === 'Završeno' ? 'done' : ''}`;
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = task.status === 'Završeno';
        cb.onclick = (e) => { e.stopPropagation(); handleStatusChange(task, cb, studentId); };

        const span = document.createElement('span');
        span.textContent = task.title;
        span.style.cursor = 'pointer';
        span.onclick = () => openEditModal(task, studentId);

        const del = document.createElement('button');
        del.className = 'delete-task-btn';
        del.textContent = 'x';
        del.onclick = (e) => {
            e.stopPropagation();
            ui.showCustomModal('Brisanje', `Obrisati "${task.title}"?`, async () => {
                const params = `?taskTime=${encodeURIComponent(task.taskTime)}&type=${encodeURIComponent(task.type)}`;
                if (await sendData(`/students/${studentId}/tasks/${task.taskId}${params}`, 'DELETE')) {
                   const student = getStudent();
                   if (student) renderMainApp(student);
                }
            });
        };

        taskDiv.append(cb, span, del);
        cell.appendChild(taskDiv);
    });
    return cell;
}

async function handleStatusChange(task, checkbox, studentId) {
    const updated = { ...task, status: checkbox.checked ? 'Završeno' : 'U toku' };
    if (await sendData(`/students/${studentId}/tasks/${task.taskId}`, 'PUT', updated)) {
        const student = getStudent();
        if (student) renderMainApp(student);
    }
}

function openEditModal(task, studentId) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'custom-modal-box';
    
    const content = ui.createEditModalContent(task, 
        async (newData) => {
            if (await sendData(`/students/${studentId}/tasks/${task.taskId}`, 'PUT', { ...task, ...newData })) {
                overlay.remove();
                const student = getStudent();
                if (student) renderMainApp(student);
            }
        }, 
        () => overlay.remove()
    );

    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

async function handleFormSubmit(e, form, studentId, currentFilter = 'Sve') {
    e.preventDefault();
    const newTask = {
        title: form.querySelector('#title-input').value,
        type: form.querySelector('#type-input').value,
        priority: parseInt(form.querySelector('#priority-input').value, 10),
        deadline: new Date(form.querySelector('#deadline-input').value).toISOString(),
        taskTime: new Date(form.querySelector('#deadline-input').value).toISOString(),
        status: 'Na čekanju'
    };
    if (await sendData(`/students/${studentId}/tasks`, 'POST', newTask)) {
        const contentDiv = document.getElementById('content');
        clearContainer(contentDiv);
        await renderDailyView(contentDiv, studentId, currentFilter);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const student = getStudent();
    if (student) {
        renderMainApp(student);
    } else {
        renderLoginForm();
    }
});

async function renderHistoryView(container, studentId, taskId, taskTitle) {
    clearContainer(container);
    const history = await fetchData(`/students/${studentId}/tasks/${taskId}/history`);
    
    const h2 = document.createElement('h2');
    h2.textContent = `Istorija statusa za: ${taskTitle}`;
    
    const table = document.createElement('table');
    table.className = 'history-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Vreme promene', 'Stari status', 'Novi status'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    const tbody = document.createElement('tbody');
    history.forEach(h => {
        const tr = document.createElement('tr');
        const d = new Date(h.changeTime);
        
        [d.toLocaleString('sr-RS'), h.oldStatus, h.newStatus].forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    table.append(thead, tbody);
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Nazad na planer';
    backBtn.className = 'btn-confirm btn-back';
    backBtn.onclick = () => renderMainApp(getStudent());

    container.append(h2, table, backBtn);
}

async function archiveTaskAction(task, studentId) {
    ui.showCustomModal('Arhiviranje', `Da li želite da arhivirate "${task.title}"?`, async () => {
        if (await sendData(`/students/${studentId}/tasks/${task.taskId}/archive`, 'POST', task)) {
            renderMainApp(getStudent());
        }
    });
}

async function renderArchivedView(container, studentId) {
    clearContainer(container);
    const tasks = await fetchData(`/students/${studentId}/archived-tasks`);
    
    const h2 = document.createElement('h2');
    h2.textContent = 'Arhiva završenih obaveza';

    const grid = document.createElement('div');
    grid.className = 'archived-grid';

    tasks.forEach(t => {
        console.log('ARCHIVED TASK:', t);
    
        const card = document.createElement('div');
        card.className = 'task-card archived';
        
        const title = document.createElement('strong');
        title.textContent = t.title;
    
        const finishedDate = new Date(t.taskTime + 'Z');
    
        const date = document.createElement('span');
        date.textContent =
            ` Završeno: ${finishedDate.toLocaleString('sr-RS')}`;
    
        const delBtn = document.createElement('button');
        delBtn.textContent = 'x';
        delBtn.className = 'delete-task-btn';
    
        delBtn.onclick = () => {
            ui.showCustomModal(
                'Trajno brisanje',
                `Obrisati arhiviranu obavezu "${t.title}"?`,
                async () => {
                    const finishedAt = encodeURIComponent(
                        finishedDate.toISOString()
                    );
    
                    const endpoint =
                        `/students/${studentId}/archived-tasks/${t.taskId}?finishedAt=${finishedAt}`;
    
                    if (await sendData(endpoint, 'DELETE')) {
                        renderArchivedView(container, studentId);
                    }
                }
            );
        };
    
        card.append(title, date, delBtn);
        grid.appendChild(card);
    });
    

    container.append(h2, grid);
}


async function renderFilteredTasks(container, studentId, type) {
    clearContainer(container);
    const tasks = await fetchData(`/students/${studentId}/tasks/type/${type}`);
    
    const uniqueTasks = tasks.filter((v, i, a) => a.findIndex(t => t.taskId === v.taskId) === i);

    const filteredDiv = document.createElement('div');
    filteredDiv.className = 'daily-view-container';
    
    const h2 = document.createElement('h2');
    h2.textContent = `Lista: ${type}`;
    filteredDiv.appendChild(h2);

    uniqueTasks.forEach(task => {
        const taskEl = ui.createTaskItemElement(task, (t, c) => handleStatusChange(t, c, studentId));
        filteredDiv.appendChild(taskEl);
    });

    container.appendChild(filteredDiv);
}