import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Esperando el estado de autenticación de Supabase...");

    const supabaseUrl = 'https://gqtljfvbeihlfkmmhnsw.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdGxqZnZiZWlobGZrbW1obnN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzY3MjQsImV4cCI6MjA3NTU1MjcyNH0.mXPJ7pekCq7xWH9MmTMZmWoBWYxcRPErw1yru-hmDdo';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let currentView = 'all';
    let creationMode = 'file';
    let currentUser = null;
    let currentPinId = null;
    let isInitialLoad = true;

    const DOM = {
        contenedorDePines: document.querySelector('body > .pin-container'),
        authButtons: document.getElementById('auth-buttons'),
        userMenu: document.getElementById('user-menu'),
        userMenuBtn: document.getElementById('user-menu-btn'),
        userDropdown: document.getElementById('user-dropdown'),
        dropdownUserEmail: document.getElementById('dropdown-user-email'),
        userInitial: document.getElementById('user-initial'),
        openLoginBtn: document.getElementById('open-login'),
        logoutBtn: document.getElementById('logout-btn'),
        myPinsBtn: document.getElementById('my-pins-btn'),
        myCreationsBtn: document.getElementById('my-creations-btn'),
        createPinBtn: document.getElementById('create-pin-btn'),
        backToAllBtn: document.getElementById('back-to-all-btn'),
        pageTitle: document.querySelector('nav h1'),
        authModal: document.getElementById('auth-modal'),
        closeAuthBtn: document.querySelector('.close-btn'),
        signupForm: document.getElementById('signup-form'),
        loginForm: document.getElementById('login-form'),
        showLoginLink: document.getElementById('show-login'),
        showSignupLink: document.getElementById('show-signup'),
        signupBtn: document.getElementById('signup-btn'),
        loginBtn: document.getElementById('login-btn'),
        googleLoginBtn: document.getElementById('google-login-btn'),
        createPinModal: document.getElementById('create-pin-modal'),
        closeCreateBtn: document.querySelector('.close-btn-create'),
        createPinForm: document.getElementById('create-pin-form'),
        optionFileBtn: document.getElementById('option-file-btn'),
        optionUrlBtn: document.getElementById('option-url-btn'),
        fileUploadSection: document.getElementById('file-upload-section'),
        urlUploadSection: document.getElementById('url-upload-section'),
        pinImageUrlInput: document.getElementById('pin-image-url'),
        pinDetailModal: document.getElementById('pin-detail-modal'),
        closeDetailBtn: document.querySelector('.close-btn-detail'),
        pinDetailImage: document.getElementById('pin-detail-image'),
        pinDetailDescription: document.getElementById('pin-detail-description'),
        pinDetailAuthor: document.getElementById('pin-detail-author'),
        visitSiteBtn: document.getElementById('visit-site-btn'),
        deletePinBtn: document.getElementById('delete-pin-btn'),
    };

    // --- Funciones de UI y Navegación ---
   function updateAuthUI(user) {
    currentUser = user;
    if (user) {
        DOM.authButtons.classList.add('hidden');
        DOM.userMenu.classList.remove('hidden');
        const displayName = user.user_metadata?.name || user.email;
        const initial = displayName.charAt(0).toUpperCase();

        // <-- CAMBIO CLAVE: Usamos innerHTML para meter el icono y el texto
        DOM.userInitial.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${initial}</span>
        `;
        
        DOM.dropdownUserEmail.textContent = user.email;
    } else {
        DOM.authButtons.classList.remove('hidden');
        DOM.userMenu.classList.add('hidden');
    }
}

    function updateNavigationView(view) {
        if (view === 'user') {
            DOM.backToAllBtn.classList.remove('hidden');
            DOM.pageTitle.textContent = 'Mis Guardados';
        } else if (view === 'created') {
            DOM.backToAllBtn.classList.remove('hidden');
            DOM.pageTitle.textContent = 'Mis Creaciones';
        } else {
            DOM.backToAllBtn.classList.add('hidden');
            DOM.pageTitle.textContent = 'Mi Clon de Pinterest';
        }
    }

    function openModal(modal) { modal.classList.remove('hidden'); }
    function closeModal(modal) { modal.classList.add('hidden'); }
    function toggleUserMenu() { DOM.userDropdown.classList.toggle('show'); }
    function setCreationMode(mode) { /* ... (sin cambios) ... */ }

    // --- Funciones de Manejo de Pines (ACTUALIZADAS) ---

    async function openPinDetailModal(pinData) {
    currentPinId = pinData.id;
    console.log(">>> Abriendo modal con los datos del pin:", pinData);
    DOM.pinDetailImage.src = pinData.image_url;
    DOM.pinDetailDescription.textContent = pinData.description;
    DOM.pinDetailAuthor.textContent = `Creado por: ${pinData.author_name}`;
    
    if (pinData.source_url && pinData.source_url.trim() !== '') {
        DOM.visitSiteBtn.href = pinData.source_url;
        DOM.visitSiteBtn.classList.remove('hidden');
    } else {
        DOM.visitSiteBtn.classList.add('hidden');
    }

    // <-- CAMBIO CLAVE: Mostramos el botón de eliminar SOLO si estamos en las vistas del usuario
    if (currentUser && (currentView === 'created' || currentView === 'user')) {
        DOM.deletePinBtn.classList.remove('hidden');
    } else {
        DOM.deletePinBtn.classList.add('hidden');
    }
    
    openModal(DOM.pinDetailModal);
}

    // <-- NUEVA FUNCIÓN: Eliminar la relación de la vista del usuario
    async function handleRemovePinFromView() {
        const isConfirmed = window.confirm("¿Estás seguro de que quieres quitar este pin de tu vista?");
        if (!isConfirmed) return;
        if (!currentPinId) { alert("Error: No se pudo identificar el pin a eliminar."); return; }
        
        try {
            // Determinamos el tipo de relación basado en la vista actual
            const relationshipType = currentView === 'created' ? 'created' : 'saved';

            const { error } = await supabase
                .from('user_pins')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('pin_id', currentPinId)
                .eq('relationship_type', relationshipType);

            if (error) throw error;
            
            alert("Pin quitado de tu vista con éxito.");
            closeModal(DOM.pinDetailModal);
            setView(currentView); // Recarga la vista actual
        } catch (error) {
            console.error("Error al quitar el pin:", error);
            alert("No se pudo quitar el pin.");
        }
    }
    
    async function handleCreatePin(event) {
        event.preventDefault();
        const description = document.getElementById('pin-description').value;
        const sourceUrl = document.getElementById('pin-source-url').value;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("Debes estar logueado para crear un pin."); return; }
        if (!description) { alert("Por favor, escribe una descripción."); return; }
        let imageUrl = '';
        try {
            if (creationMode === 'url') {
                imageUrl = DOM.pinImageUrlInput.value;
                if (!imageUrl) { alert("Por favor, introduce una URL de imagen."); return; }
            } else {
                const file = document.getElementById('pin-image-input').files[0];
                if (!file) { alert("Por favor, selecciona una imagen."); return; }
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('shots').upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('shots').getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            // Insertamos el pin en la tabla 'pins'
            const { data: newPin, error: insertError } = await supabase.from('pins').insert({
                image_url: imageUrl, description: description, source_url: sourceUrl,
                creator_id: user.id,
            }).select().single(); // Pedimos que nos devuelva el pin recién creado

            if (insertError) throw insertError;

            // <-- CAMBIO CLAVE: Creamos la relación 'created' en la nueva tabla
            const { error: relationshipError } = await supabase.from('user_pins').insert({
                user_id: user.id,
                pin_id: newPin.id,
                relationship_type: 'created',
            });

            if (relationshipError) throw relationshipError;

            alert('¡Pin creado con éxito!');
            closeModal(DOM.createPinModal);
            DOM.createPinForm.reset();
            setCreationMode('file');
            setView('created');
        } catch (error) {
            console.error("Error al crear el pin:", error);
            alert('No se pudo crear el pin. Revisa la consola para más detalles.');
        }
    }

    async function handleSavePin(event) {
        const button = event.target.closest('.save-pin-btn');
        const pinId = button.dataset.pinId;
        
        if (!currentUser) { alert("Debes iniciar sesión para guardar pines."); return; }
        button.textContent = 'Guardando...'; button.disabled = true;
        try {
            // <-- CAMBIO CLAVE: Insertamos en la nueva tabla 'user_pins'
            const { error } = await supabase.from('user_pins').insert({
                user_id: currentUser.id,
                pin_id: pinId,
                relationship_type: 'saved',
            });
            if (error) throw error;
            
            setView(currentView); // Recarga la vista para actualizar el botón

        } catch (error) {
            console.error('Error al guardar el pin:', error);
            alert('No se pudo guardar el pin.');
            button.textContent = 'Guardar';
            button.disabled = false;
        }
    }

    async function handleUnsavePin(event) {
        const button = event.target.closest('.save-pin-btn');
        const pinId = button.dataset.pinId;

        if (!currentUser) return;

        button.textContent = 'Quitando...'; button.disabled = true;
        try {
            // <-- CAMBIO CLAVE: Borramos de la nueva tabla 'user_pins'
            const { error } = await supabase
                .from('user_pins')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('pin_id', pinId)
                .eq('relationship_type', 'saved');

            if (error) throw error;

            setView(currentView); // Recarga la vista para actualizar el botón

        } catch (error) {
            console.error('Error al dejar de guardar el pin:', error);
            alert('No se pudo quitar el pin.');
            button.textContent = 'Guardado';
            button.disabled = false;
        }
    }

    // --- Función Principal de Obtención y Renderizado (CORREGIDA Y DEFINITIVA) ---
async function fetchAndDisplayPines({ filter = 'all' }) {
    DOM.contenedorDePines.innerHTML = '<p style="text-align: center; color: #ccc;">Cargando...</p>';
    
    let query = supabase
        .from('pins')
        .select(`
            id,
            image_url,
            description,
            source_url,
            creator_id,
            creator: pins_creator_id_fkey!inner(name),
            user_pins!left(relationship_type)
        `);

    if (filter === 'user') {
        console.log(">>> FILTRO APLICADO: Mis Guardados (con dos pasos)");
        if (currentUser) {
            // <-- PASO 1: Obtener los IDs de los pines guardados
            const { data: savedPinData, error: savedError } = await supabase
                .from('user_pins')
                .select('pin_id')
                .eq('user_id', currentUser.id)
                .eq('relationship_type', 'saved');

            if (savedError) {
                console.error("Error al obtener pines guardados:", savedError);
                DOM.contenedorDePines.innerHTML = "<p>Error al cargar los pines guardados.</p>";
                return;
            }

            const savedPinIds = savedPinData.map(p => p.pin_id);

            // <-- PASO 2: Filtrar la tabla 'pins' usando el array de IDs
            if (savedPinIds.length > 0) {
                query = query.in('id', savedPinIds);
            } else {
                // Si no hay pines guardados, devolver un array vacío
                DOM.contenedorDePines.innerHTML = "<p>Aún no has guardado ningún pin.</p>";
                return;
            }
        } else {
            DOM.contenedorDePines.innerHTML = "<p>No has iniciado sesión.</p>";
            return;
        }
    } else if (filter === 'created') {
        console.log(">>> FILTRO APLICADO: Mis Creaciones (con dos pasos)");
        if (currentUser) {
            // <-- PASO 1: Obtener los IDs de los pines creados
            const { data: createdPinData, error: createdError } = await supabase
                .from('user_pins')
                .select('pin_id')
                .eq('user_id', currentUser.id)
                .eq('relationship_type', 'created');

            if (createdError) {
                console.error("Error al obtener pines creados:", createdError);
                DOM.contenedorDePines.innerHTML = "<p>Error al cargar tus creaciones.</p>";
                return;
            }

            const createdPinIds = createdPinData.map(p => p.pin_id);

            // <-- PASO 2: Filtrar la tabla 'pins' usando el array de IDs
            if (createdPinIds.length > 0) {
                query = query.in('id', createdPinIds);
            } else {
                // Si no hay pines creados, devolver un array vacío
                DOM.contenedorDePines.innerHTML = "<p>Aún no has creado ningún pin.</p>";
                return;
            }
        } else {
            DOM.contenedorDePines.innerHTML = "<p>No has iniciado sesión.</p>";
            return;
        }
    } else {
        console.log(">>> FILTRO APLICADO: Todos los Pines");
    }
        
    const { data, error } = await query;
    if (error) { console.error("Error fetching pins:", error); DOM.contenedorDePines.innerHTML = "<p>Error al cargar los pines.</p>"; return; }
    if (!data || data.length === 0) { DOM.contenedorDePines.innerHTML = "<p>No hay pines para mostrar.</p>"; return; }

    DOM.contenedorDePines.innerHTML = '';

        // ... dentro de fetchAndDisplayPines, después de la consulta a la base de datos
    data.forEach(pin => {
        const pinElement = document.createElement('div');
        pinElement.classList.add('pin');
        pinElement.dataset.pinId = pin.id;
        pinElement.dataset.sourceUrl = pin.source_url || '';
        pinElement.dataset.creatorId = pin.creator_id;
        pinElement.dataset.authorName = pin.creator?.name || 'Autor Desconocido';

        pinElement.innerHTML = `<img src="${pin.image_url}" alt="${pin.description}" onerror="this.src='https://via.placeholder.com/200x250.png?text=Error'"><p>${pin.description}</p>`;
        
        const userRelationships = pin.user_pins || [];
              // ... (código anterior)
        const isSavedByCurrentUser = currentUser && userRelationships.some(rel => rel.relationship_type === 'saved');
        const isCreatedByCurrentUser = currentUser && userRelationships.some(rel => rel.relationship_type === 'created');

        // <-- LÓGICA ANTIGUA (INCORRECTA)
        // if (currentUser && !isCreatedByCurrentUser) {

        // <-- LÓGICA NUEVA (CORRECTA)
        if (currentUser) {
            console.log("ENTRANDO: Se debería mostrar el botón de guardar para el pin:", pin.id);
            const overlay = document.createElement('div');
            overlay.classList.add('pin-overlay');
            const saveButton = document.createElement('button');
            saveButton.classList.add('save-pin-btn');
            
            if (isSavedByCurrentUser) {
                saveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Guardado`;
                saveButton.onclick = handleUnsavePin;
            } else {
                saveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> Guardar`;
                saveButton.onclick = handleSavePin;
            }
            
            saveButton.dataset.pinId = pin.id;
            overlay.appendChild(saveButton);
            pinElement.appendChild(overlay);
        } else {
             console.log("NO SE MUESTRA el botón porque el usuario no está logueado. Pin:", pin.id);
        }
        // ... (resto del código)
        DOM.contenedorDePines.appendChild(pinElement);
    });
}

    function setView(view) {
        currentView = view;
        updateNavigationView(view);
        fetchAndDisplayPines({ filter: view });
    }
    
    // --- Funciones de Autenticación ---
    async function handleSignup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        if (!name || !email || !password) { alert('Por favor, rellena todos los campos.'); return; }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name } } });
        if (error) { alert('Error al registrar: ' + error.message); } else { alert('¡Registro exitoso! Por favor, revisa tu email para confirmar.'); closeModal(DOM.authModal); }
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) { alert('Por favor, rellena todos los campos.'); return; }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { alert('Error al iniciar sesión: ' + error.message); } else { closeModal(DOM.authModal); }
    }
   async function handleGoogleLogin() {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) alert('Error al iniciar sesión con Google: ' + error.message);
    }
   async function handleLogout() {
        const { error } = await supabase.auth.signOut();
        if (error) alert('Error al cerrar sesión: ' + error.message);
    }

    // --- Configuración de Event Listeners ---
    DOM.userMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleUserMenu(); });
    window.addEventListener('click', (e) => { if (!DOM.userMenu.contains(e.target)) { DOM.userDropdown.classList.remove('show'); } });
    DOM.myPinsBtn.addEventListener('click', () => setView('user'));
    DOM.myCreationsBtn.addEventListener('click', () => setView('created'));
    DOM.createPinBtn.addEventListener('click', () => openModal(DOM.createPinModal));
    DOM.logoutBtn.addEventListener('click', handleLogout);
    DOM.backToAllBtn.addEventListener('click', () => setView('all'));
    DOM.openLoginBtn.addEventListener('click', () => { DOM.loginForm.classList.remove('hidden'); DOM.signupForm.classList.add('hidden'); openModal(DOM.authModal); });
    DOM.showLoginLink.addEventListener('click', (e) => { e.preventDefault(); DOM.signupForm.classList.add('hidden'); DOM.loginForm.classList.remove('hidden'); });
    DOM.showSignupLink.addEventListener('click', (e) => { e.preventDefault(); DOM.loginForm.classList.add('hidden'); DOM.signupForm.classList.remove('hidden'); });
    DOM.signupBtn.addEventListener('click', handleSignup);
    DOM.loginBtn.addEventListener('click', handleLogin);
    DOM.googleLoginBtn.addEventListener('click', handleGoogleLogin);
    DOM.closeAuthBtn.addEventListener('click', () => closeModal(DOM.authModal));
    DOM.closeCreateBtn.addEventListener('click', () => closeModal(DOM.createPinModal));
    DOM.createPinForm.addEventListener('submit', handleCreatePin);
    DOM.optionFileBtn.addEventListener('click', () => setCreationMode('file'));
    DOM.optionUrlBtn.addEventListener('click', () => setCreationMode('url'));
    DOM.pinImageUrlInput.addEventListener('input', (e) => {
        const imageUrl = e.target.value;
        const sourceUrlInput = document.getElementById('pin-source-url');
        if (sourceUrlInput.value.trim() === '') { sourceUrlInput.value = imageUrl; }
    });
    DOM.closeDetailBtn.addEventListener('click', () => closeModal(DOM.pinDetailModal));
    DOM.deletePinBtn.addEventListener('click', handleRemovePinFromView);
    window.addEventListener('click', (event) => {
        if (event.target === DOM.authModal) closeModal(DOM.authModal);
        if (event.target === DOM.createPinModal) closeModal(DOM.createPinModal);
        if (event.target === DOM.pinDetailModal) closeModal(DOM.pinDetailModal);
    });
    
    DOM.contenedorDePines.addEventListener('click', (e) => {
        const pinElement = e.target.closest('.pin');
        if (pinElement && !e.target.closest('.save-pin-btn')) {
            const pinData = {
                id: pinElement.dataset.pinId,
                image_url: pinElement.querySelector('img').src,
                description: pinElement.querySelector('p').textContent,
                author_name: pinElement.dataset.authorName,
                source_url: pinElement.dataset.sourceUrl,
                creator_id: pinElement.dataset.creatorId,
            };
            openPinDetailModal(pinData);
        }
    });

    // --- INICIALIZACIÓN ---
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("Cambio de estado de autenticación:", event, session?.user?.email || 'Sesión cerrada');
        updateAuthUI(session?.user ?? null);
        if (isInitialLoad) {
            setView('all');
            isInitialLoad = false;
        } else if (event === 'SIGNED_OUT') {
            setView('all');
        }
    });
});