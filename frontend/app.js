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

    const switcher = ui.createViewSwitcher(currentView, (view) => {
        currentView = view;
        renderContent();
    });

    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';

    appContainer.append(header, switcher, contentDiv);

    async function renderContent() {
        clearContainer(contentDiv);
        if (currentView === 'daily') {
            await renderDailyView(contentDiv, studentId);
        } else {
            await renderWeeklyView(contentDiv, studentId);
        }
    }

    renderContent();
}

async function renderDailyView(container, studentId) {
    const tasks = await fetchData(`/students/${studentId}/tasks/daily/${helpers.getTodayDateStr()}`);
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
        tasks.forEach(task => dailyContainer.appendChild(ui.createTaskItemElement(task, (t, c) => handleStatusChange(t, c, studentId))));
    }

    container.append(dailyContainer, ui.createAddTaskForm((e, f) => handleFormSubmit(e, f, studentId)));
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

async function handleFormSubmit(e, form, studentId) {
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
        const student = getStudent();
        if (student) renderMainApp(student);
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