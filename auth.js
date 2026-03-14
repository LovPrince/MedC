// ── Supabase init ──────────────────────────────────────────
const { createClient } = supabase;
const _supabase = createClient(
    'https://lepynnzywhhdekscefni.supabase.co',
    'sb_publishable_btqkknNtpbVzX9dmiNR1YA_immqAptx'
);

// ── Elements ───────────────────────────────────────────────
const overlay = document.getElementById('overlay');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const googleBtn = document.getElementById('googleBtn');
const googleBtnText = document.getElementById('googleBtnText');
const submitBtn = document.getElementById('submitBtn');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const forgotLink = document.getElementById('forgotLink');
const forgotWrap = document.getElementById('forgotWrap');
const confirmField = document.getElementById('confirmField');
const feedback = document.getElementById('feedback');
const toast = document.getElementById('toast');
const toastDot = toast.querySelector('.toast-dot');

let mode = 'login';

// ── Modal open/close ───────────────────────────────────────
function openModal(e) { e.preventDefault(); overlay.classList.remove('hidden'); }
function closeModal() { overlay.classList.add('hidden'); clearFeedback(); }

if (openBtn) openBtn.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Switch login / signup ──────────────────────────────────
function setMode(m) {
    mode = m;
    clearFeedback();
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('confirmPassword').value = '';

    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        document.getElementById('modalTitle').innerHTML = 'Welcome <em>back</em>';
        document.getElementById('modalSubtitle').textContent = 'Sign in to continue to your dashboard';
        document.getElementById('dividerText').textContent = 'or sign in with email';
        googleBtnText.textContent = 'Continue with Google';
        submitBtn.textContent = 'Sign in';
        confirmField.classList.add('hidden');
        forgotWrap.classList.remove('hidden');
        document.getElementById('footerNote').innerHTML =
            'No account yet? <a href="#" id="switchLink">Create one →</a>';
    } else {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        document.getElementById('modalTitle').innerHTML = 'Create an <em>account</em>';
        document.getElementById('modalSubtitle').textContent = 'Sign up to get started with MedC';
        document.getElementById('dividerText').textContent = 'or sign up with email';
        googleBtnText.textContent = 'Sign up with Google';
        submitBtn.textContent = 'Create account';
        confirmField.classList.remove('hidden');
        forgotWrap.classList.add('hidden');
        document.getElementById('footerNote').innerHTML =
            'Already have an account? <a href="#" id="switchLink">Sign in →</a>';
    }

    document.getElementById('switchLink').addEventListener('click', (e) => {
        e.preventDefault();
        setMode(mode === 'login' ? 'signup' : 'login');
    });
}

tabLogin.addEventListener('click', () => setMode('login'));
tabSignup.addEventListener('click', () => setMode('signup'));
document.getElementById('switchLink').addEventListener('click', (e) => {
    e.preventDefault();
    setMode(mode === 'login' ? 'signup' : 'login');
});

// ── Feedback ───────────────────────────────────────────────
function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = `feedback ${type}`;
}
function clearFeedback() {
    feedback.textContent = '';
    feedback.className = 'feedback';
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, success = true) {
    toastDot.style.background = success ? '#1D9E75' : '#e24b4a';
    const label = toast.querySelector('span:not(.toast-dot)');
    if (label) label.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Google OAuth ───────────────────────────────────────────
googleBtn.addEventListener('click', async () => {
    showToast('Redirecting to Google…');
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) showToast(error.message, false);
});

// ── Email submit ───────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const conf = document.getElementById('confirmPassword').value;

    if (!email || !pass) { showFeedback('Please fill in all fields.', 'error'); return; }

    if (mode === 'signup') {
        if (pass.length < 6) { showFeedback('Password must be at least 6 characters.', 'error'); return; }
        if (pass !== conf) { showFeedback('Passwords do not match.', 'error'); return; }
    }

    submitBtn.textContent = 'Please wait…';
    submitBtn.disabled = true;
    clearFeedback();

    if (mode === 'login') {
        const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
        submitBtn.textContent = 'Sign in';
        submitBtn.disabled = false;
        if (error) { showFeedback(error.message, 'error'); }
        else { showToast('Signed in! Welcome back.'); closeModal(); updateNavForUser(data.user); }
    } else {
        const { error } = await _supabase.auth.signUp({ email, password: pass });
        submitBtn.textContent = 'Create account';
        submitBtn.disabled = false;
        if (error) { showFeedback(error.message, 'error'); }
        else { showFeedback('Account created! Check your email to confirm.', 'success'); }
    }
});

// ── Forgot password ────────────────────────────────────────
forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    if (!email) { showFeedback('Enter your email above first.', 'error'); return; }
    const { error } = await _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset.html`
    });
    if (error) showFeedback(error.message, 'error');
    else showFeedback('Reset link sent — check your inbox!', 'success');
});

// ── Session check ──────────────────────────────────────────
_supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) updateNavForUser(session.user);
});
_supabase.auth.onAuthStateChange((event, session) => {
    if (session) updateNavForUser(session.user);
});

// ── Update nav when logged in ──────────────────────────────
function updateNavForUser(user) {
    if (!user || !openBtn) return;
    openBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${user.email.split('@')[0]}`;
    openBtn.removeEventListener('click', openModal);
    openBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await _supabase.auth.signOut();
        openBtn.innerHTML = `<i class="fa-brands fa-google" style="color:#ea4335"></i> Login`;
        openBtn.addEventListener('click', openModal);
        showToast('Signed out.');
    });
}