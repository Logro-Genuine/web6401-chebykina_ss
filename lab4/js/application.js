class CourseApplication {
    constructor(name, email, course, consent) {
        this.name = name;
        this.email = email;
        this.course = course;
        this.consent = consent;
    }

    print() {
        console.group('Заявка на обучение в ЛЮМЕНАР');
        console.table({
            'Имя': this.name,
            'Почта': this.email,
            'Курс': this.course,
            'Согласие': this.consent ? 'Да' : 'Нет',
        });
        console.groupEnd();
    }
}

const form = document.querySelector('#application-form');
const statusElement = document.querySelector('#application-status');
const submitButton = form.querySelector('button[type="submit"]');

function showStatus(message, state) {
    statusElement.textContent = message;
    statusElement.className = 'application__status';
    if (state) {
        statusElement.classList.add(`application__status--${state}`);
    }
}

// submit обрабратывается так, чтобы форма работала и при нажатии enter
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    if (name.length < 2) {
        showStatus('Введи имя длиной не менее двух символов.', 'error');
        form.elements.name.focus();
        return;
    }

    const application = new CourseApplication(
        name,
        email,
        form.elements.course.value,
        form.elements.consent.checked,
    );
    application.print();

    submitButton.disabled = true;
    showStatus('Отправляем заявку...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(application),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new Error('Не удалось отправить заявку. Проверь данные и попробуй снова.');
        }
        const result = await response.json();
        showStatus(result.message, 'success');
        form.reset();
    } catch (error) {
        showStatus(
            error instanceof TypeError || error.name === 'AbortError'
                ? 'Сервер не отвечает. Попробуй отправить заявку позже.'
                : error.message,
            'error',
        );
    } finally {
        clearTimeout(timeout);
        submitButton.disabled = false;
    }
});
