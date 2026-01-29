import * as ui from './UI/ui.js';
import { fetchData, sendData, STUDENT_ID } from './API/api.js';
import * as helpers  from './helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    let currentView = 'daily';

    async function renderApp() {
        appContainer.innerHTML = '';
        
        const title = document.createElement('h1');
        title.textContent = 'Moj Studentski Organizator';
        
        const switcher = ui.createViewSwitcher(currentView, (view) => {
            currentView = view;
            renderApp();
        });

        const contentDiv = document.createElement('div');
        contentDiv.id = 'content';

        appContainer.append(title, switcher, contentDiv);
        currentView === 'daily' ? await renderDailyView() : await renderWeeklyView();
    }

    async function renderDailyView() {
        const contentDiv = document.getElementById('content');
        const tasks = await fetchData(`/students/${STUDENT_ID}/tasks/daily/${helpers.getTodayDateStr()}`);

        const container = document.createElement('div');
        container.className = 'daily-view-container';

        const h2 = document.createElement('h2');
        h2.textContent = `Obaveze za danas (${helpers.formatDateSerbian(new Date())})`;
        container.appendChild(h2);

        if (tasks.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Nema obaveza za danas.';
            container.appendChild(p);
        } else {
            tasks.forEach(task => container.appendChild(ui.createTaskItemElement(task, handleStatusChange)));
        }

        contentDiv.append(container, ui.createAddTaskForm(handleFormSubmit));
    }

    async function renderWeeklyView() {
        const contentDiv = document.getElementById('content');
        const startOfWeek = helpers.getStartOfWeek(new Date());
        const tasks = await fetchData(`/students/${STUDENT_ID}/tasks/weekly/${helpers.formatDateForApi(startOfWeek)}`);

        const weeklyContainer = document.createElement('div');
        weeklyContainer.className = 'weekly-view-container';

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            weeklyContainer.appendChild(createWeeklyDayCell(currentDate, tasks));
        }
        contentDiv.appendChild(weeklyContainer);
    }

    function createWeeklyDayCell(date, allTasks) {
        const dateStr = date.toLocaleDateString('en-CA');
        const tasksForDay = allTasks.filter(t => new Date(t.taskTime).toLocaleDateString('en-CA') === dateStr);
        
        const cell = document.createElement('div');
        cell.className = 'day-cell';

        const header = document.createElement('div');
        header.className = 'day-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = date.toLocaleDateString('sr-RS', { weekday: 'long' });
        
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
            cb.onclick = (e) => { e.stopPropagation(); handleStatusChange(task, cb); };

            const span = document.createElement('span');
            span.textContent = task.title;
            span.style.cursor = 'pointer';
            span.onclick = () => openEditModal(task);

            const del = document.createElement('button');
            del.className = 'delete-task-btn';
            del.textContent = 'x';
            del.onclick = (e) => {
                e.stopPropagation();
                ui.showCustomModal('Brisanje', `Obrisati "${task.title}"?`, async () => {
                    const params = `?taskTime=${encodeURIComponent(task.taskTime)}&type=${encodeURIComponent(task.type)}`;
                    if (await sendData(`/students/${STUDENT_ID}/tasks/${task.taskId}${params}`, 'DELETE')) renderApp();
                });
            };

            taskDiv.append(cb, span, del);
            cell.appendChild(taskDiv);
        });
        return cell;
    }

    async function handleStatusChange(task, checkbox) {
        const updated = { ...task, status: checkbox.checked ? 'Završeno' : 'U toku' };
        if (await sendData(`/students/${STUDENT_ID}/tasks/${task.taskId}`, 'PUT', updated)) renderApp();
    }

    function openEditModal(task) {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'custom-modal-box';
        
        const content = ui.createEditModalContent(task, 
            async (newData) => {
                if (await sendData(`/students/${STUDENT_ID}/tasks/${task.taskId}`, 'PUT', { ...task, ...newData })) {
                    overlay.remove();
                    renderApp();
                }
            }, 
            () => overlay.remove()
        );

        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    async function handleFormSubmit(e, form) {
        e.preventDefault();
        const newTask = {
            title: form.querySelector('#title-input').value,
            type: form.querySelector('#type-input').value,
            priority: parseInt(form.querySelector('#priority-input').value, 10),
            deadline: new Date(form.querySelector('#deadline-input').value).toISOString(),
            taskTime: new Date(form.querySelector('#deadline-input').value).toISOString(),
            status: 'Na čekanju'
        };
        if (await sendData(`/students/${STUDENT_ID}/tasks`, 'POST', newTask)) renderApp();
    }

    renderApp();
});