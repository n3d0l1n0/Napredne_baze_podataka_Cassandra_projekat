export function createViewSwitcher(currentView, onViewChange) {
    const switcherDiv = document.createElement('div');
    switcherDiv.className = 'view-switcher';

    const dailyButton = document.createElement('button');
    dailyButton.textContent = 'Dnevni Prikaz';
    if (currentView === 'daily') dailyButton.classList.add('active');
    dailyButton.addEventListener('click', () => onViewChange('daily'));

    const weeklyButton = document.createElement('button');
    weeklyButton.textContent = 'Nedeljni Prikaz';
    if (currentView === 'weekly') weeklyButton.classList.add('active');
    weeklyButton.addEventListener('click', () => onViewChange('weekly'));

    switcherDiv.appendChild(dailyButton);
    switcherDiv.appendChild(weeklyButton);
    return switcherDiv;
}

export function createTaskItemElement(task, onStatusChange) {
    const item = document.createElement('div');
    item.className = 'task-item';
    if (task.status === 'Završeno') item.classList.add('done');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'Završeno';
    checkbox.addEventListener('change', () => onStatusChange(task, checkbox));

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'task-details';
    
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `Tip: ${task.type} | Prioritet: ${task.priority} | Rok: ${new Date(task.deadline).toLocaleDateString('sr-RS')}`;

    detailsDiv.appendChild(title);
    detailsDiv.appendChild(meta);
    item.appendChild(checkbox);
    item.appendChild(detailsDiv);

    return item;
}

export function createAddTaskForm(onSubmit) {
    const form = document.createElement('form');
    form.className = 'add-task-form';
    form.addEventListener('submit', (e) => onSubmit(e, form));

    form.appendChild(createFormGroup('title-input', 'Naziv obaveze', 'text'));
    form.appendChild(createFormGroup('type-input', 'Tip', 'text', 'Npr. Nastavna, Lična...'));
    form.appendChild(createFormGroup('priority-input', 'Prioritet', 'number'));
    form.appendChild(createFormGroup('deadline-input', 'Rok', 'datetime-local'));

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Dodaj obavezu';
    form.appendChild(submitButton);
    
    return form;
}

export function createFormGroup(id, labelText, type, placeholder = '') {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    
    const input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.placeholder = placeholder;
    input.required = true;

    if (type === 'number') {
        input.min = 1; input.max = 5; input.value = 3;
    }
    if (type === 'datetime-local') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        input.value = tomorrow.toISOString().slice(0, 16);
    }

    group.appendChild(label);
    group.appendChild(input);
    return group;
}


export function showCustomModal(titleText, messageText, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'custom-modal-box';

    const h3 = document.createElement('h3');
    h3.textContent = titleText;

    const p = document.createElement('p');
    p.textContent = messageText;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'modal-buttons';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Potvrdi';
    confirmBtn.className = 'btn-confirm';
    confirmBtn.onclick = () => {
        onConfirm();
        overlay.remove();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Otkaži';
    cancelBtn.className = 'btn-cancel';
    cancelBtn.onclick = () => overlay.remove();

    btnContainer.append(confirmBtn, cancelBtn);
    modal.append(h3, p, btnContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

export function createEditModalContent(task, onSave, onCancel) {
    const container = document.createElement('div');

    const h3 = document.createElement('h3');
    h3.textContent = 'Izmeni obavezu';

    const form = document.createElement('form');

    const labelTitle = document.createElement('label');
    labelTitle.textContent = 'Naslov:';
    const inputTitle = document.createElement('input');
    inputTitle.type = 'text';
    inputTitle.value = task.title;

    const labelStatus = document.createElement('label');
    labelStatus.textContent = 'Status:';
    const selectStatus = document.createElement('select');
    ['Na čekanju', 'U toku', 'Završeno'].forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === task.status) opt.selected = true;
        selectStatus.appendChild(opt);
    });

    const footer = document.createElement('div');
    footer.className = 'edit-form-footer';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.textContent = 'Sačuvaj';
    saveBtn.className = 'btn-confirm';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Odustani';
    closeBtn.className = 'btn-cancel';
    closeBtn.onclick = onCancel;

    form.onsubmit = (e) => {
        e.preventDefault();
        onSave({ title: inputTitle.value, status: selectStatus.value });
    };

    footer.append(saveBtn, closeBtn);
    form.append(labelTitle, inputTitle, labelStatus, selectStatus, footer);
    container.append(h3, form);

    return container;
}