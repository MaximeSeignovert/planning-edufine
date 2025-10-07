class PlanningApp {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.bearerToken = localStorage.getItem('bearerToken') || '';
        this.userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
        this.renderTimeSlots();
        this.updateWeekRange();
        this.renderCalendar();

        // Charger automatiquement le planning si un token existe
        if (this.bearerToken.trim()) {
            this.loadPlanning();
        }

        // Mettre à jour la ligne de temps actuelle toutes les minutes
        this.updateCurrentTimeLine();
        setInterval(() => this.updateCurrentTimeLine(), 60000);
    }

    setupEventListeners() {
        document.getElementById('prevWeek').addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.changeWeek(1));
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Soumettre avec Enter
        document.getElementById('email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    checkLoginStatus() {
        if (this.bearerToken && this.userInfo) {
            this.showAccountSection();
        } else {
            this.showLoginSection();
        }
    }

    showLoginSection() {
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('accountSection').style.display = 'none';
    }

    showAccountSection() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('accountSection').style.display = 'flex';

        if (this.userInfo) {
            document.getElementById('accountName').textContent =
                `${this.userInfo.FIRSTNAME} ${this.userInfo.LASTNAME}`;
        }
    }

    async login() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showError('Veuillez remplir tous les champs');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion...';

        try {
            const response = await fetch('https://api.edusign.fr/student/account/getByCredentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    EMAIL: email,
                    PASSWORD: password,
                    LANGUAGE: 'fr'
                })
            });

            if (!response.ok) {
                throw new Error('Identifiants incorrects');
            }

            const data = await response.json();

            if (data.status === 'success' && data.result.TOKEN) {
                this.bearerToken = data.result.TOKEN;
                this.userInfo = data.result;

                // Sauvegarder dans localStorage
                localStorage.setItem('bearerToken', this.bearerToken);
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));

                // Effacer le mot de passe
                document.getElementById('password').value = '';

                // Afficher la section compte
                this.showAccountSection();

                // Charger le planning
                this.loadPlanning();
            } else {
                throw new Error('Réponse invalide du serveur');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            this.showError(`Erreur de connexion: ${error.message}`);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Se connecter';
        }
    }

    logout() {
        this.bearerToken = '';
        this.userInfo = null;
        localStorage.removeItem('bearerToken');
        localStorage.removeItem('userInfo');

        document.getElementById('email').value = '';
        document.getElementById('password').value = '';

        this.showLoginSection();
        this.renderCalendar([]);
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
        return new Date(d.setDate(diff));
    }

    changeWeek(direction) {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
        this.updateWeekRange();
        this.loadPlanning();
    }

    updateWeekRange() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const startStr = this.currentWeekStart.toLocaleDateString('fr-FR', options);
        const endStr = weekEnd.toLocaleDateString('fr-FR', options);

        document.getElementById('weekRange').textContent = `${startStr} - ${endStr}`;
    }

    renderTimeSlots(startHour = 0, endHour = 23) {
        const timeSlotsContainer = document.querySelector('.time-slots');
        timeSlotsContainer.innerHTML = '';

        for (let hour = startHour; hour <= endHour; hour++) {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeSlotsContainer.appendChild(slot);
        }
    }

    renderCalendar(courses = []) {
        const container = document.getElementById('daysContainer');
        container.innerHTML = '';

        // Calculer les heures min et max des cours
        let minHour = 24;
        let maxHour = 0;

        if (courses.length > 0) {
            courses.forEach(course => {
                const startDate = new Date(course.START);
                const endDate = new Date(course.END);
                const startHour = startDate.getHours();
                const endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0);

                minHour = Math.min(minHour, startHour);
                maxHour = Math.max(maxHour, endHour);
            });

            // Ajouter une marge d'une heure avant et après
            minHour = Math.max(0, minHour - 1);
            maxHour = Math.min(23, maxHour + 1);
        } else {
            minHour = 8;
            maxHour = 18;
        }

        // Mettre à jour les créneaux horaires
        this.renderTimeSlots(minHour, maxHour);

        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(this.currentWeekStart);
            currentDate.setDate(currentDate.getDate() + i);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <div class="day-name">${daysOfWeek[i]}</div>
                <div class="day-date">${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}</div>
            `;

            const dayEvents = document.createElement('div');
            dayEvents.className = 'day-events';

            // Filtrer et afficher les cours pour ce jour
            const dayCourses = courses.filter(course => {
                const courseDate = new Date(course.START);
                return courseDate.toDateString() === currentDate.toDateString();
            });

            dayCourses.forEach(course => {
                const event = this.createEventElement(course, minHour);
                dayEvents.appendChild(event);
            });

            dayColumn.appendChild(dayHeader);
            dayColumn.appendChild(dayEvents);
            container.appendChild(dayColumn);
        }

        // Ajuster la hauteur du conteneur d'événements
        const hourRange = maxHour - minHour + 1;
        document.querySelectorAll('.day-events').forEach(el => {
            el.style.height = `${hourRange * 60}px`;
        });

        // Mettre à jour la ligne de temps actuelle
        this.updateCurrentTimeLine();
    }

    createEventElement(course, minHour = 0) {
        const event = document.createElement('div');
        event.className = 'event';

        // Déterminer la classe CSS en fonction du statut
        if (course.STUDENT_PRESENCE) {
            event.classList.add('present');
        } else if (course.STUDENT_IS_JUSTIFICATED || course.JUSTIFIED) {
            event.classList.add('justified');
        } else if (course.STUDENT_ABSENCE_ID) {
            event.classList.add('absent');
        }

        const startDate = new Date(course.START);
        const endDate = new Date(course.END);

        // Calculer la position et la hauteur relative à minHour
        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const endHour = endDate.getHours() + endDate.getMinutes() / 60;
        const duration = endHour - startHour;

        event.style.top = `${(startHour - minHour) * 60}px`;
        event.style.height = `${duration * 60}px`;

        // Formatter les heures
        const formatTime = (date) => {
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        };

        event.innerHTML = `
            <div class="event-name" title="${course.NAME}">${course.NAME}</div>
            <div class="event-time">${formatTime(startDate)} - ${formatTime(endDate)}</div>
            ${course.CLASSROOM ? `<div class="event-classroom">Salle ${course.CLASSROOM}</div>` : ''}
        `;

        // Ajouter un tooltip au survol
        event.title = `${course.NAME}\n${formatTime(startDate)} - ${formatTime(endDate)}\n${course.CLASSROOM ? 'Salle ' + course.CLASSROOM : ''}`;

        return event;
    }

    async loadPlanning() {
        if (!this.bearerToken.trim()) {
            this.showError('Veuillez vous connecter');
            return;
        }

        const weekStart = new Date(this.currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const url = `https://api.edusign.fr/student/planning?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`;

        try {
            const container = document.getElementById('daysContainer');
            container.innerHTML = '<div class="loading">Chargement du planning...</div>';

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Token invalide ou expiré');
                }
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success' && Array.isArray(data.result)) {
                this.renderCalendar(data.result);
            } else {
                throw new Error('Format de réponse invalide');
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);

            // Si erreur d'authentification, déconnecter
            if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Token invalide')) {
                this.logout();
                this.showError('Session expirée, veuillez vous reconnecter');
            } else {
                this.showError(`Erreur: ${error.message}`);
                this.renderCalendar([]);
            }
        }
    }

    showError(message) {
        const container = document.getElementById('daysContainer');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    updateCurrentTimeLine() {
        // Supprimer les anciennes lignes
        document.querySelectorAll('.current-time-line').forEach(el => el.remove());

        const now = new Date();
        const today = now.toDateString();

        // Trouver la colonne du jour actuel
        const dayColumns = document.querySelectorAll('.day-column');
        dayColumns.forEach((column, index) => {
            const currentDate = new Date(this.currentWeekStart);
            currentDate.setDate(currentDate.getDate() + index);

            if (currentDate.toDateString() === today) {
                const dayEvents = column.querySelector('.day-events');
                if (!dayEvents) return;

                // Récupérer minHour depuis la première time-slot
                const firstTimeSlot = document.querySelector('.time-slot');
                if (!firstTimeSlot) return;

                const minHour = parseInt(firstTimeSlot.textContent.split(':')[0]);
                const currentHour = now.getHours() + now.getMinutes() / 60;

                // Calculer la position relative
                const position = (currentHour - minHour) * 60;

                // Vérifier si l'heure actuelle est dans la plage visible
                const dayEventsHeight = parseFloat(dayEvents.style.height || '0');
                if (position >= 0 && position <= dayEventsHeight) {
                    const timeLine = document.createElement('div');
                    timeLine.className = 'current-time-line';
                    timeLine.style.top = `${position}px`;
                    dayEvents.appendChild(timeLine);
                }
            }
        });
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new PlanningApp();
});
