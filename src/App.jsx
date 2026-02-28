import React, { useEffect, useRef } from 'react';
import './index.css';

export default function App() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // --- FIREBASE & EMAILJS CONFIG ---
    const firebaseConfig = {
        apiKey: "AIzaSyAymSlwO04HqSVegsGJlMw5OpcvlbhLSgo",
        authDomain: "ar-braincode.firebaseapp.com",
        projectId: "ar-braincode",
        storageBucket: "ar-braincode.firebasestorage.app",
        messagingSenderId: "233137702682",
        appId: "1:233137702682:web:8cfe2cc081b9224a0b0ea3"
    };
    if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
    }
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    window.emailjs.init("MJfoOIpjZcKwINELa");

    window.generatedOTP = "";
    window.otpExpireTime = 0;
    window.isOtpSent = false;
    window.appState = { currentUserUid: null, currentUserProfile: null, videos: [], currentTab: 'home', activeVideoId: null };
    window.ytPlayer = null;
    window.videoSkipped = false;
    window.lastVideoTime = 0;
    window.videoInterval = null;

    window.onYouTubeIframeAPIReady = function() {}

    window.setupTheme = function() {
        const saved = localStorage.getItem('arbraincode_theme_v3');
        if(saved === 'light') { document.documentElement.classList.remove('dark'); } 
        else { document.documentElement.classList.add('dark'); }
    }

    window.toggleTheme = function() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('arbraincode_theme_v3', isDark ? 'dark' : 'light');
    }

    window.showToast = function(msg, duration = 2000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast bg-[#18181b] dark:bg-white text-white dark:text-black px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border border-white/10 dark:border-black/10';
        toast.innerHTML = `<i class="fa-solid fa-bolt text-brand-500"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 250);
        }, duration); 
    }

    // AUTH & ROUTING
    window.authMode = 'login'; 
    window.setAuthMode = function(mode) {
        window.authMode = mode;
        window.isOtpSent = false;
        document.getElementById('signup-otp-field').classList.add('hidden');
        const btnLogin = document.getElementById('tab-login');
        const btnSignup = document.getElementById('tab-signup');
        const nameField = document.getElementById('signup-name-field');
        const confirmPwdField = document.getElementById('signup-confirm-password-field');
        const btnText = document.getElementById('auth-btn-text');
        const submitBtn = document.getElementById('auth-submit-btn');
        const forgotLink = document.getElementById('forgot-password-link');
        submitBtn.disabled = false;
        if(mode === 'login') {
            btnLogin.className = "flex-1 py-3 rounded-lg text-sm font-semibold bg-[#2c2c2e] shadow text-white transition-all";
            btnSignup.className = "flex-1 py-3 rounded-lg text-sm font-medium text-gray-500 transition-all";
            nameField.classList.add('hidden'); confirmPwdField.classList.add('hidden'); forgotLink.classList.remove('hidden');
            btnText.innerText = "Log In";
        } else {
            btnSignup.className = "flex-1 py-3 rounded-lg text-sm font-semibold bg-[#2c2c2e] shadow text-white transition-all";
            btnLogin.className = "flex-1 py-3 rounded-lg text-sm font-medium text-gray-500 transition-all";
            nameField.classList.remove('hidden'); confirmPwdField.classList.remove('hidden'); forgotLink.classList.add('hidden');
            btnText.innerText = "Register & Send Code";
        }
    }

    window.showForgotPassword = function() {
        document.getElementById('auth-scroll-area').classList.add('hidden'); document.getElementById('auth-tabs-container').classList.add('hidden'); document.getElementById('forgot-password-area').classList.remove('hidden');
    }
    window.hideForgotPassword = function() {
        document.getElementById('auth-scroll-area').classList.remove('hidden'); document.getElementById('auth-tabs-container').classList.remove('hidden'); document.getElementById('forgot-password-area').classList.add('hidden');
    }

    window.sendResetLink = function() {
        const email = document.getElementById('forgot-email').value.trim();
        if(!email) { window.showToast("Please enter your email address."); return; }
        const btn = document.getElementById('forgot-submit-btn'); btn.disabled = true; btn.innerText = "Sending...";
        auth.sendPasswordResetEmail(email).then(() => {
            window.showToast("Reset link sent securely! Check your email inbox.", 4000); window.hideForgotPassword(); btn.disabled = false; btn.innerText = "Send Reset Link";
        }).catch((error) => {
            window.showToast("Error: " + error.message, 3000); btn.disabled = false; btn.innerText = "Send Reset Link";
        });
    }

    window.togglePassword = function(inputId, iconId) {
        const input = document.getElementById(inputId); const icon = document.getElementById(iconId);
        if (input.type === "password") { input.type = "text"; icon.classList.replace('fa-eye', 'fa-eye-slash'); } else { input.type = "password"; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
    }

    window.setButtonLoading = function(isLoading, text) {
        const btnText = document.getElementById('auth-btn-text'); const btn = document.getElementById('auth-submit-btn');
        if(isLoading) { btn.disabled = true; btnText.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${text}`; } else { btn.disabled = false; btnText.innerHTML = text; }
    }

    window.authenticate = function() {
        const email = document.getElementById('auth-email').value.trim().toLowerCase();
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value.trim();
        const confirmPassword = document.getElementById('auth-confirm-password').value;
        if(!email || !password) { window.showToast("Please enter email and password."); return; }
        if(window.authMode === 'signup') {
            if(!name) { window.showToast("Please enter your name."); return; }
            const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!pwdRegex.test(password)) { window.showToast("Password must be 8+ chars with a number, uppercase, and special character."); return; }
            if(password !== confirmPassword) { window.showToast("Passwords do not match."); return; }
            
            if(!window.isOtpSent) {
                window.setButtonLoading(true, "Sending Code...");
                window.generatedOTP = Math.floor(100000 + Math.random()*900000).toString();
                window.otpExpireTime = Date.now() + 5*60*1000;
                window.emailjs.send("service_2k0zc3r", "template_q8wtm0i", { email: email, otp: window.generatedOTP })
                .then(() => {
                    window.showToast("OTP sent to your email!"); window.isOtpSent = true;
                    document.getElementById('signup-otp-field').classList.remove('hidden'); window.setButtonLoading(false, "Verify & Create Account");
                }).catch(err => {
                    window.showToast("Failed to send OTP. Try again."); window.setButtonLoading(false, "Register & Send Code"); console.error(err);
                });
            } else {
                const userOTP = document.getElementById("auth-otp").value.trim();
                if(Date.now() > window.otpExpireTime) { window.showToast("OTP expired. Please try again."); window.setAuthMode('signup'); return; }
                if(userOTP === window.generatedOTP) {
                    window.setButtonLoading(true, "Creating Account...");
                    auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        return userCredential.user.updateProfile({ displayName: name }).then(() => {
                            return db.collection('users').doc(userCredential.user.uid).set({
                                name: name, email: email, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14b8a6&color=fff`,
                                isPremium: false, xp: 0, unlockedItems: [], favorites: [], usedPromos: [], lastDaily: 0, isBlocked: false
                            }, { merge: true });
                        });
                    }).then(() => {
                        window.showToast("Account created successfully!"); window.setButtonLoading(false, "Log In");
                        document.getElementById('auth-password').value = ""; document.getElementById('auth-otp').value = "";
                    }).catch((error) => {
                        if (error.code === 'auth/email-already-in-use') { window.showToast("This email is already registered! Please Log In."); } else { window.showToast(error.message); }
                        window.setButtonLoading(false, "Verify & Create Account");
                    });
                } else { window.showToast("Incorrect OTP!"); }
            }
        } else {
            window.setButtonLoading(true, "Logging in...");
            auth.signInWithEmailAndPassword(email, password).then(() => {
                window.showToast("Login successful!"); window.setButtonLoading(false, "Log In"); document.getElementById('auth-password').value = "";
            }).catch((error) => { window.showToast(error.message); window.setButtonLoading(false, "Log In"); });
        }
    }

    window.logout = function() { auth.signOut().then(() => window.showToast("Logged out successfully")).catch((e) => window.showToast(e.message)); }
    window.getCurrentUser = function() { return window.appState.currentUserProfile; }

    // ROUTING & UI
    window.routeApp = function() {
        if (!window.appState.currentUserUid) {
            document.getElementById('view-auth').classList.remove('hidden'); document.getElementById('view-auth').classList.add('flex');
            document.getElementById('view-main').classList.add('hidden'); document.getElementById('view-main').classList.remove('flex');
        } else {
            document.getElementById('view-auth').classList.add('hidden'); document.getElementById('view-auth').classList.remove('flex');
            document.getElementById('view-main').classList.remove('hidden'); document.getElementById('view-main').classList.add('flex');
            window.updateUI(); window.renderAll();
        }
    }

    window.switchTab = function(tabId) {
        ['home', 'videos', 'premium', 'profile'].forEach(tab => {
            document.getElementById(`tab-${tab}`).classList.add('hidden'); document.getElementById(`tab-${tab}`).classList.remove('block');
        });
        document.getElementById(`tab-${tabId}`).classList.remove('hidden'); document.getElementById(`tab-${tabId}`).classList.add('block');
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if(btn.dataset.target === tabId) { btn.classList.add('text-gray-900', 'dark:text-white'); btn.classList.remove('text-gray-400'); } else { btn.classList.remove('text-gray-900', 'dark:text-white'); btn.classList.add('text-gray-400'); }
        });
        if(tabId === 'videos') window.filterVideos(); else if (tabId === 'profile') window.updateProfileUI(); else if (tabId === 'premium') window.renderPremium();
        document.getElementById('main-content').scrollTop = 0; window.appState.currentTab = tabId;
    }

    window.generateCardContent = function(v, user, isFav) {
        return `
            <div class="w-full aspect-video bg-gray-200 dark:bg-gray-800 relative">
                <img src="https://img.youtube.com/vi/${v.ytId}/hqdefault.jpg" class="w-full h-full object-cover">
                <div class="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2.5 py-1 rounded backdrop-blur-md font-medium"><i class="fa-solid fa-play mr-1"></i> Watch</div>
            </div>
            <div class="p-4 relative">
                ${isFav ? '<i class="fa-solid fa-heart absolute top-4 right-4 text-brand-500 text-lg"></i>' : '<i class="fa-regular fa-heart absolute top-4 right-4 text-gray-300 dark:text-gray-600 text-lg"></i>'}
                <h4 class="font-extrabold pr-8 mb-1.5 text-[15px] leading-snug">${v.title}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">${v.description || ''}</p>
            </div>
        `;
    }

    window.updateUI = function() {
        const user = window.getCurrentUser(); if(!user) return;
        const displayName = user.name ? user.name.split(' ')[0] : 'Developer';
        document.getElementById('home-username').innerText = displayName; document.getElementById('home-xp').innerText = user.xp || 0;
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=14b8a6&color=fff`;
        document.getElementById('home-avatar-img').src = avatarUrl; window.updateProfileUI();
    }

    window.updateProfileUI = function() {
        const user = window.getCurrentUser(); if(!user) return;
        document.getElementById('profile-name').innerText = user.name || 'Developer'; document.getElementById('profile-xp').innerText = user.xp || 0;
        document.getElementById('profile-favs').innerText = (user.favorites || []).length;
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=14b8a6&color=fff`;
        document.getElementById('profile-avatar-img').src = avatarUrl;
        const status = document.getElementById('profile-status');
        if (user.isPremium) { status.innerHTML = '<span class="text-brand-500 font-bold">Pro Member</span>'; } else { status.innerText = 'Free Member'; }
    }

    window.renderAll = function() { window.renderHome(); window.renderPremium(); if(window.appState.currentTab === 'videos') window.filterVideos(); }

    window.renderHome = function() {
        const latest = [...window.appState.videos].slice(0, 4); const container = document.getElementById('home-latest-container'); container.innerHTML = '';
        if(latest.length === 0) { container.innerHTML = '<p class="text-gray-500 text-sm py-4">No content available yet.</p>'; return; }
        const user = window.getCurrentUser();
        latest.forEach(v => {
            const isFav = (user?.favorites || []).includes(v.id);
            container.innerHTML += `
                <div class="snap-start shrink-0 w-[260px] card-glass rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer" onclick="window.openVideoModal('${v.id}')">
                    <div class="w-full aspect-video bg-gray-200 dark:bg-gray-800 relative">
                        <img src="https://img.youtube.com/vi/${v.ytId}/hqdefault.jpg" class="w-full h-full object-cover">
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                            <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><i class="fa-solid fa-play text-white text-xl ml-1"></i></div>
                        </div>
                    </div>
                    <div class="p-4"><h4 class="font-bold text-[15px] truncate-2-lines leading-snug">${v.title}</h4></div>
                </div>
            `;
        });
    }

    window.filterVideos = function() {
        const query = document.getElementById('video-search').value.toLowerCase(); const container = document.getElementById('videos-list-container');
        const user = window.getCurrentUser(); container.innerHTML = '';
        const filtered = window.appState.videos.filter(v => { return v.title.toLowerCase().includes(query) || (v.description && v.description.toLowerCase().includes(query)); });
        if (filtered.length === 0) { container.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fa-solid fa-folder-open text-4xl mb-3"></i><p class="font-medium text-sm">No results found</p></div>'; return; }
        filtered.forEach(v => {
            const isFav = (user?.favorites || []).includes(v.id);
            container.innerHTML += `<div class="card-glass rounded-2xl overflow-hidden flex flex-col active:scale-[0.98] transition-transform cursor-pointer" onclick="window.openVideoModal('${v.id}')">${window.generateCardContent(v, user, isFav)}</div>`;
        });
    }

    window.renderPremium = function() {
        const container = document.getElementById('premium-list-container'); const user = window.getCurrentUser(); const banner = document.getElementById('premium-status-banner'); container.innerHTML = '';
        if(!user) return;
        banner.innerHTML = `<div class="inline-block bg-white/10 px-4 py-2 rounded-full font-bold text-brand-400 border border-brand-500/30 text-sm">Your XP: ${user.xp || 0}</div>`;
        const premiumVids = window.appState.videos.filter(v => (v.sourceCode && v.sourceCode.trim() !== ""));
        if(premiumVids.length === 0) { container.innerHTML = '<p class="text-gray-500 text-sm py-4">No premium content available yet.</p>'; return; }
        premiumVids.forEach(v => {
            const isUnlocked = user.isPremium || ((user.unlockedItems || []).includes(v.id));
            const actionButton = isUnlocked ? `<button onclick="window.openVideoModal('${v.id}')" class="px-3 py-1.5 bg-brand-500/10 text-brand-500 rounded-lg text-xs font-bold transition-all">View</button>` : `<button onclick="window.unlockItem('${v.id}', 400)" class="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold active:scale-95 transition-transform">Unlock (400 XP)</button>`;
            container.innerHTML += `
                <div class="card-glass p-4 rounded-2xl flex gap-4 items-center transition-transform">
                    <div class="w-28 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-gray-800 cursor-pointer" onclick="window.openVideoModal('${v.id}')">
                        <img src="https://img.youtube.com/vi/${v.ytId}/hqdefault.jpg" class="w-full h-full object-cover opacity-80">
                        <div class="absolute inset-0 flex items-center justify-center">${isUnlocked ? '<i class="fa-solid fa-unlock text-white drop-shadow-md"></i>' : '<i class="fa-solid fa-lock text-white drop-shadow-md"></i>'}</div>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="font-bold text-sm leading-snug mb-2 truncate cursor-pointer" onclick="window.openVideoModal('${v.id}')">${v.title}</h4>
                        <div class="flex items-center justify-between">
                            <div class="text-[10px] font-semibold ${isUnlocked ? 'text-brand-500' : 'text-gray-500'} flex items-center gap-1 uppercase tracking-wide">
                                ${isUnlocked ? '<i class="fa-solid fa-check text-[10px]"></i> UNLOCKED' : `<i class="fa-solid fa-star text-[10px]"></i> 400 XP`}
                            </div>
                            ${actionButton}
                        </div>
                    </div>
                </div>`;
        });
    }

    // MODALS & ACTIONS
    window.tempAvatarFile = null;
    window.openEditProfile = function() {
        const user = window.getCurrentUser(); if (!user) return;
        document.getElementById('edit-name').value = user.name || ''; document.getElementById('edit-email').value = user.email || '';
        document.getElementById('edit-avatar-preview').src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=14b8a6&color=fff`;
        const modal = document.getElementById('modal-edit-profile'); modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('translate-y-full'); }, 10);
    }
    window.closeEditProfile = function() {
        const modal = document.getElementById('modal-edit-profile'); modal.classList.add('translate-y-full');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); window.tempAvatarFile = null; document.getElementById('edit-avatar-input').value = ""; }, 200);
    }
    window.handleAvatarSelect = function(event) {
        const file = event.target.files[0];
        if (file) { window.tempAvatarFile = file; const reader = new FileReader(); reader.onload = (e) => { document.getElementById('edit-avatar-preview').src = e.target.result; }; reader.readAsDataURL(file); }
    }
    window.saveProfile = async function() {
        const newName = document.getElementById('edit-name').value.trim(); if (!newName) return window.showToast("Name cannot be empty");
        const btn = document.getElementById('save-profile-btn'); btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
        let newAvatarUrl = window.getCurrentUser().avatar;
        try {
            if (window.tempAvatarFile) {
                const formData = new FormData(); formData.append('image', window.tempAvatarFile);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=a3dc9f5e84768929fce19040d5a6382e`, { method: 'POST', body: formData });
                const data = await res.json(); if (data.success) { newAvatarUrl = data.data.url; } else { throw new Error("Image upload failed."); }
            }
            await auth.currentUser.updateProfile({ displayName: newName, photoURL: newAvatarUrl });
            await db.collection('users').doc(window.appState.currentUserUid).update({ name: newName, avatar: newAvatarUrl });
            window.showToast("Profile updated successfully!"); window.closeEditProfile();
        } catch (e) { window.showToast(e.message || "Failed to update profile."); console.error(e); } finally { btn.disabled = false; btn.innerText = "Save Changes"; }
    }

    const modalList = ['guide', 'help', 'report', 'about'];
    modalList.forEach(m => {
        window[`open${m.charAt(0).toUpperCase() + m.slice(1)}`] = function() {
            const modal = document.getElementById(`modal-${m}`); modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('translate-y-full'); }, 10);
        };
        window[`close${m.charAt(0).toUpperCase() + m.slice(1)}`] = function() {
            const modal = document.getElementById(`modal-${m}`); modal.classList.add('translate-y-full'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); if(m==='report') document.getElementById('report-text').value = ''; }, 200);
        };
    });

    window.submitReport = function() {
        const text = document.getElementById('report-text').value.trim(); if(!text) { window.showToast("Please enter the issue details."); return; }
        const user = window.getCurrentUser();
        db.collection('reports').add({ email: user ? user.email : 'Unknown', uid: window.appState.currentUserUid || 'guest', text: text, date: Date.now() })
        .then(() => { window.showToast("Report submitted successfully! We will review it."); window.closeReport(); })
        .catch(err => { window.showToast("Failed to submit report."); });
    }

    window.unlockItem = function(id, cost) {
        const user = window.getCurrentUser(); if(!user) return;
        if (user.xp >= cost) {
            user.xp -= cost; user.unlockedItems = user.unlockedItems || []; if (!user.unlockedItems.includes(id)) { user.unlockedItems.push(id); }
            db.collection('users').doc(window.appState.currentUserUid).update({ xp: user.xp, unlockedItems: user.unlockedItems })
            .then(() => { window.showToast('Source Code Unlocked Successfully! 🎉'); window.renderPremium(); }).catch(err => { window.showToast('Error unlocking item.'); });
        } else { window.showToast(`Not enough XP. You need ${cost - user.xp} more XP.`); }
    }

    window.openVideoModal = function(id) {
        const v = window.appState.videos.find(x => x.id === id); const user = window.getCurrentUser(); if (!v || !user) return;
        window.appState.activeVideoId = id; document.getElementById('modal-title').innerText = v.title; document.getElementById('mcontent-desc').innerText = v.description || "";
        const favBtn = document.getElementById('modal-fav-btn');
        if((user.favorites || []).includes(v.id)) { favBtn.innerHTML = '<i class="fa-solid fa-heart text-brand-500"></i>'; } else { favBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; }
        favBtn.onclick = () => window.toggleFavorite(v.id);
        const btnPrompt = document.getElementById('mtab-prompt'); const btnCode = document.getElementById('mtab-code');
        btnPrompt.classList.add('hidden'); btnCode.classList.add('hidden');
        if (v.prompt && v.prompt.trim() !== "") { btnPrompt.classList.remove('hidden'); document.getElementById('modal-prompt-text').innerText = v.prompt; }
        if (v.sourceCode && v.sourceCode.trim() !== "") { btnCode.classList.remove('hidden'); document.getElementById('modal-source-code').innerText = v.sourceCode; }
        document.getElementById('iframe-container').innerHTML = '<div id="yt-player-div"></div>';
        if (window.YT && window.YT.Player) {
            window.ytPlayer = new window.YT.Player('yt-player-div', { videoId: v.ytId, playerVars: { 'rel': 0, 'controls': 1 }, events: { 'onStateChange': window.onPlayerStateChange } });
        }
        window.videoSkipped = false; window.lastVideoTime = 0; clearInterval(window.videoInterval); window.setModalTab('video');
        const modal = document.getElementById('modal-video'); modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('translate-y-full'); }, 10);
    }

    window.onPlayerStateChange = function(event) {
        if (event.data == window.YT.PlayerState.PLAYING) {
            if (window.ytPlayer && window.ytPlayer.getCurrentTime) { let currentTime = window.ytPlayer.getCurrentTime(); if (window.lastVideoTime > 0 && Math.abs(currentTime - window.lastVideoTime) > 3) { window.videoSkipped = true; } window.lastVideoTime = currentTime; }
            clearInterval(window.videoInterval);
            window.videoInterval = setInterval(() => { if (window.ytPlayer && window.ytPlayer.getCurrentTime) { let currentTime = window.ytPlayer.getCurrentTime(); if (Math.abs(currentTime - window.lastVideoTime) > 3) { window.videoSkipped = true; } window.lastVideoTime = currentTime; } }, 1000);
        } else if (event.data == window.YT.PlayerState.ENDED) {
            clearInterval(window.videoInterval);
            if (!window.videoSkipped) {
                const user = window.getCurrentUser(); const newXp = (user.xp || 0) + 15;
                db.collection('users').doc(window.appState.currentUserUid).update({ xp: newXp }); window.showToast('+15 XP for watching full video! ⚡');
            } else { window.showToast('Video skipped. No XP awarded.'); }
        } else { clearInterval(window.videoInterval); }
    }

    window.closeModal = function(type) {
        const modal = document.getElementById(`modal-${type}`); modal.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden'); modal.classList.remove('flex');
            if(type === 'video') { clearInterval(window.videoInterval); if (window.ytPlayer && window.ytPlayer.destroy) { try { window.ytPlayer.destroy(); } catch(e){} } window.ytPlayer = null; document.getElementById('iframe-container').innerHTML = ''; window.appState.activeVideoId = null; }
        }, 200); 
    }

    window.setModalTab = function(tab) {
        if (tab === 'code') {
            const v = window.appState.videos.find(x => x.id === window.appState.activeVideoId); const user = window.getCurrentUser();
            const hasSourceCode = v.sourceCode && v.sourceCode.trim() !== ""; const isUnlocked = user && (user.isPremium || ((user.unlockedItems || []).includes(v.id)));
            if (hasSourceCode && !isUnlocked) { window.showToast("Redirecting to PRO Section to unlock this Code...", 2500); window.closeModal('video'); setTimeout(() => window.switchTab('premium'), 300); return; }
        }
        if (tab !== 'video' && window.ytPlayer && typeof window.ytPlayer.pauseVideo === 'function') { try { window.ytPlayer.pauseVideo(); } catch(e) {} }
        ['video', 'prompt', 'code'].forEach(t => {
            const btn = document.getElementById(`mtab-${t}`); const content = document.getElementById(`mcontent-${t}`); if (!btn || !content) return;
            if (t === tab) { btn.classList.add('bg-white', 'dark:bg-[#27272a]', 'shadow-sm', 'text-gray-900', 'dark:text-white'); btn.classList.remove('text-gray-500'); content.classList.remove('hidden'); if(t === 'video' || t === 'prompt' || t === 'code') content.classList.add('flex'); } 
            else { btn.classList.remove('bg-white', 'dark:bg-[#27272a]', 'shadow-sm', 'text-gray-900', 'dark:text-white'); btn.classList.add('text-gray-500'); content.classList.add('hidden'); content.classList.remove('block', 'flex'); }
        });
    }

    window.copyData = function(elementId) {
        const text = document.getElementById(elementId).innerText;
        navigator.clipboard.writeText(text).then(() => { window.showToast('Data copied securely'); }).catch(err => {
            const textArea = document.createElement("textarea"); textArea.value = text; document.body.appendChild(textArea); textArea.select();
            try { document.execCommand('copy'); window.showToast('Data copied securely'); } catch (err) { window.showToast('Failed to copy.'); } document.body.removeChild(textArea);
        });
    }

    window.toggleFavorite = function(id) {
        const user = window.getCurrentUser(); if(!user) return;
        user.favorites = user.favorites || []; const idx = user.favorites.indexOf(id);
        if(idx > -1) { user.favorites.splice(idx, 1); window.showToast('Removed from favorites'); } else { user.favorites.push(id); window.showToast('Saved to favorites ⚡'); }
        db.collection('users').doc(window.appState.currentUserUid).update({ favorites: user.favorites });
        const favBtn = document.getElementById('modal-fav-btn');
        if(user.favorites.includes(id)) { favBtn.innerHTML = '<i class="fa-solid fa-heart text-brand-500"></i>'; } else { favBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; }
        if(window.appState.currentTab === 'videos') window.filterVideos(); window.updateProfileUI();
    }

    window.shareContent = function() {
        const title = document.getElementById('modal-title').innerText;
        if (navigator.share) { navigator.share({ title: `AR BRAINCODE - ${title}`, url: window.location.href }).catch(console.error); } 
        else { navigator.clipboard.writeText(`Check out: ${title} on AR BRAINCODE`).then(() => { window.showToast('Link copied to share'); }); }
    }

    window.redeemCode = async function() {
        const input = document.getElementById('promo-code-input').value.trim().toUpperCase(); const user = window.getCurrentUser(); if(!user || !input) return;
        try {
            const promoSnap = await db.collection('promos').doc(input).get();
            if(promoSnap.exists) {
                const promoData = promoSnap.data();
                if (promoData.isActive === false) { return window.showToast('This code is inactive.'); }
                user.usedPromos = user.usedPromos || []; if(user.usedPromos.includes(input)) { return window.showToast('You have already used this code.'); }
                user.xp = (user.xp || 0) + promoData.xp; user.usedPromos.push(input);
                await db.collection('users').doc(window.appState.currentUserUid).update({ xp: user.xp, usedPromos: user.usedPromos });
                window.showToast(`+${promoData.xp} XP added! 🎉`); document.getElementById('promo-code-input').value = '';
            } else { window.showToast('Invalid Code.'); }
        } catch(e) { window.showToast('Error validating code.'); }
    }

    // --- INIT CALLS ---
    window.setupTheme();
    let userUnsubscribe = null;
    db.collection('videos').onSnapshot((snapshot) => {
        const fetchedVideos = []; snapshot.forEach(doc => { fetchedVideos.push({ id: doc.id, ...doc.data() }); });
        window.appState.videos = fetchedVideos.sort((a,b) => b.date - a.date); if (window.appState.currentUserUid) window.renderAll();
    });

    auth.onAuthStateChanged((user) => {
        if (user) {
            window.appState.currentUserUid = user.uid;
            if (userUnsubscribe) userUnsubscribe();
            userUnsubscribe = db.collection('users').doc(user.uid).onSnapshot((docSnap) => {
                if (docSnap.exists) {
                    window.appState.currentUserProfile = docSnap.data();
                    if ((!window.appState.currentUserProfile.name || window.appState.currentUserProfile.name === 'Developer') && user.displayName) {
                        window.appState.currentUserProfile.name = user.displayName; db.collection('users').doc(user.uid).update({ name: user.displayName });
                    }
                    window.appState.currentUserProfile.favorites = window.appState.currentUserProfile.favorites || [];
                    window.appState.currentUserProfile.unlockedItems = window.appState.currentUserProfile.unlockedItems || [];
                    window.appState.currentUserProfile.usedPromos = window.appState.currentUserProfile.usedPromos || [];
                    if(window.appState.currentUserProfile.isBlocked) { auth.signOut(); window.showToast("Your account has been blocked by the administrator."); return; }
                    window.updateUI(); document.getElementById('view-loading').classList.add('hidden'); window.routeApp();
                } else {
                    const finalName = user.displayName || "Developer"; const defaultAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=14b8a6&color=fff`;
                    db.collection('users').doc(user.uid).set({ name: finalName, email: user.email, avatar: defaultAvatar, isPremium: false, xp: 0, unlockedItems: [], favorites: [], usedPromos: [], lastDaily: 0, isBlocked: false });
                }
            });
        } else {
            if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
            window.appState.currentUserUid = null; window.appState.currentUserProfile = null;
            setTimeout(() => { document.getElementById('view-loading').classList.add('hidden'); window.routeApp(); }, 600);
        }
    });

  }, []);

  // Is line ke neeche tumhara exact 100% original HTML as a raw string inject hoga. 
  // Ye React ki ek special trick hai jisse "NOT A SINGLE CHANGE" rule follow hota hai.
  const rawHTML = `
    <div id="app-wrapper" class="bg-gray-50 dark:bg-dark-bg flex flex-col h-full overflow-hidden relative">
        
        <div id="toast-container"></div>

        <div id="view-loading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-dark-bg">
            <div class="relative w-24 h-24 mb-6">
                <div class="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
                <div class="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                    <img id="splash-logo" src="https://uploads.onecompiler.io/43d4xt63k/44eepue29/PHOTO-2026-02-23-13-07-30.jpg" alt="Logo" class="w-16 h-16 object-cover rounded-full" referrerpolicy="no-referrer">
                </div>
            </div>
            <h1 class="text-xl font-bold tracking-tight">AR BRAINCODE</h1>
            <p class="mt-1 text-xs text-gray-500 uppercase tracking-widest font-medium">Starting Environment</p>
        </div>

        <div id="view-auth" class="absolute inset-0 z-30 hidden flex-col items-center justify-center bg-[#000] p-4">
            <div class="w-full max-w-md bg-[#0a0a0a] rounded-3xl p-8 border border-[#27272a] shadow-2xl flex flex-col h-[90vh] max-h-[700px]">
                
                <div class="flex flex-col items-center mb-8 shrink-0">
                    <div class="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-transparent mb-4 border border-[#27272a]">
                        <img id="auth-logo" src="https://uploads.onecompiler.io/43d4xt63k/44eepue29/PHOTO-2026-02-23-13-07-30.jpg" alt="Logo" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                    </div>
                    <h1 class="text-2xl font-extrabold text-white tracking-tight">AR BRAINCODE</h1>
                    <p class="text-gray-400 text-sm mt-1">Join the creator network</p>
                </div>

                <div class="flex bg-[#1c1c1e] p-1 rounded-xl mb-6 shrink-0" id="auth-tabs-container">
                    <button onclick="window.setAuthMode('login')" id="tab-login" class="flex-1 py-3 rounded-lg text-sm font-semibold bg-[#2c2c2e] shadow text-white transition-all">Log In</button>
                    <button onclick="window.setAuthMode('signup')" id="tab-signup" class="flex-1 py-3 rounded-lg text-sm font-medium text-gray-500 transition-all">Register</button>
                </div>

                <div class="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-6" id="auth-scroll-area">
                    <div id="signup-name-field" class="hidden">
                        <input type="text" id="auth-name" class="input-native border border-[#27272a]" placeholder="Full Name">
                    </div>
                    <div>
                        <input type="email" id="auth-email" class="input-native border border-[#27272a]" placeholder="Email Address">
                    </div>
                    <div class="relative" id="password-container">
                        <input type="password" id="auth-password" class="input-native border border-[#27272a] pr-10" placeholder="Password">
                        <button onclick="window.togglePassword('auth-password', 'pwd-icon')" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 p-2 active:scale-90 transition-transform">
                            <i class="fa-solid fa-eye" id="pwd-icon"></i>
                        </button>
                    </div>
                    <div id="signup-confirm-password-field" class="hidden relative mt-4">
                        <input type="password" id="auth-confirm-password" class="input-native border border-[#27272a] pr-10" placeholder="Confirm Password">
                        <button onclick="window.togglePassword('auth-confirm-password', 'pwd-confirm-icon')" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 p-2 active:scale-90 transition-transform">
                            <i class="fa-solid fa-eye" id="pwd-confirm-icon"></i>
                        </button>
                    </div>
                    
                    <div id="signup-otp-field" class="hidden">
                        <input type="text" id="auth-otp" class="input-native font-mono tracking-[0.5em] text-center text-lg mt-2 uppercase border border-[#27272a]" placeholder="------" maxlength="6">
                        <p class="text-[12px] text-brand-500 mt-2 text-center font-semibold">Enter the 6-digit code sent to your email.</p>
                    </div>
                    
                    <button onclick="window.authenticate()" id="auth-submit-btn" class="w-full py-4 mt-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:scale-100">
                        <span id="auth-btn-text">Log In</span>
                    </button>

                    <div id="forgot-password-link" class="text-center mt-4">
                        <button onclick="window.showForgotPassword()" class="text-sm text-brand-500 font-semibold active:scale-95 transition-transform">Forgot Password?</button>
                    </div>
                </div>

                <div id="forgot-password-area" class="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-6 hidden">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
                    <p class="text-sm text-gray-500 mb-4">Enter your email address to receive an official, secure password reset link directly from Firebase.</p>
                    <div>
                        <input type="email" id="forgot-email" class="input-native border border-[#27272a]" placeholder="Email Address">
                    </div>
                    <button onclick="window.sendResetLink()" id="forgot-submit-btn" class="w-full py-4 mt-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-brand-500/20">
                        Send Reset Link
                    </button>
                    <div class="text-center mt-4">
                        <button onclick="window.hideForgotPassword()" class="text-sm text-gray-500 font-semibold active:scale-95 transition-transform">Back to Login</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-main" class="hidden flex-col h-full relative bg-[#f4f4f5] dark:bg-dark-bg overflow-hidden">
            
            <header class="glass shrink-0 z-20 px-5 py-3 flex justify-between items-center w-full" style="padding-top: max(env(safe-area-inset-top), 12px);">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-sm bg-transparent border border-gray-200 dark:border-[#27272a]">
                        <img id="app-header-logo" src="https://uploads.onecompiler.io/43d4xt63k/44eepue29/PHOTO-2026-02-23-13-07-30.jpg" alt="Logo" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                    </div>
                    <span class="font-extrabold text-lg tracking-tight">AR <span class="text-brand-500 font-medium">BRAINCODE</span></span>
                </div>
                <div class="flex items-center gap-5">
                    <button onclick="window.toggleTheme()" class="text-gray-900 dark:text-white active:scale-90 transition-transform">
                        <i class="fa-solid fa-moon dark:hidden text-lg"></i>
                        <i class="fa-solid fa-sun hidden dark:block text-lg"></i>
                    </button>
                </div>
            </header>

            <main id="main-content" class="flex-1 overflow-y-auto no-scrollbar pb-28 relative page-enter">
                
                <div id="tab-home" class="p-5 space-y-8 block">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent shadow-sm bg-gray-200 dark:bg-gray-800 cursor-pointer active:scale-95 transition-transform" onclick="window.switchTab('profile')">
                                <img id="home-avatar-img" src="" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                            </div>
                            <div>
                                <p class="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Welcome back,</p>
                                <h2 class="text-xl font-bold tracking-tight" id="home-username">Developer</h2>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center gap-1.5 font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-sm">
                                <i class="fa-solid fa-star text-sm"></i> <span id="home-xp">0</span> XP
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white shadow-lg active:scale-[0.98] transition-transform cursor-pointer" onclick="window.open('https://t.me/arbraincode', '_blank')">
                            <div class="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                            <div class="flex items-center justify-between relative z-10">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <i class="fa-brands fa-telegram text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg leading-tight">Join the Network</h3>
                                        <p class="text-sm opacity-90 mt-0.5">Daily drops & pro codes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] p-5 text-white shadow-lg active:scale-[0.98] transition-transform cursor-pointer" onclick="window.open('https://instagram.com/arbraincode', '_blank')">
                            <div class="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                            <div class="flex items-center justify-between relative z-10">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                        <i class="fa-brands fa-instagram text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg leading-tight">Follow on Instagram</h3>
                                        <p class="text-sm opacity-90 mt-0.5">For more updates follow on Instagram</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <section>
                        <div class="flex justify-between items-end mb-4">
                            <h3 class="font-bold text-xl tracking-tight">Trending Now</h3>
                            <button onclick="window.switchTab('videos')" class="text-sm text-brand-500 font-semibold active:scale-95 transition-transform">See All</button>
                        </div>
                        <div class="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x" id="home-latest-container">
                        </div>
                    </section>
                </div>

                <div id="tab-videos" class="p-5 hidden">
                    <div class="sticky top-0 z-10 bg-[#f4f4f5] dark:bg-dark-bg pt-1 pb-4">
                        <div class="relative">
                            <i class="fa-solid fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="text" id="video-search" oninput="window.filterVideos()" placeholder="Search content..." class="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-dark-elevated border border-gray-200 dark:border-dark-border focus:border-brand-500 outline-none text-sm shadow-sm transition-all">
                        </div>
                    </div>
                    <div class="space-y-5 mt-2" id="videos-list-container">
                    </div>
                </div>

                <div id="tab-premium" class="p-5 hidden">
                    <div class="text-center py-8 px-6 mb-6 rounded-3xl bg-gray-900 dark:bg-dark-elevated border border-gray-800 dark:border-dark-border text-white relative overflow-hidden shadow-2xl">
                        <div class="absolute -right-10 -top-10 w-40 h-40 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
                        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-accent-500 rounded-full blur-3xl opacity-20"></div>
                        
                        <div class="w-16 h-16 mx-auto bg-gradient-to-tr from-brand-400 to-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
                            <i class="fa-solid fa-layer-group text-2xl text-white"></i>
                        </div>
                        <h2 class="text-2xl font-extrabold mb-2 tracking-tight">Premium Access</h2>
                        <p class="text-sm text-gray-400 mb-6 font-medium">Use your earned XP to individually unlock high-value source codes.</p>
                        
                        <div id="premium-status-banner"></div>
                    </div>

                    <div class="card-glass p-5 rounded-2xl mb-8">
                        <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Redeem Special Code</h3>
                        <div class="flex gap-2">
                            <input type="text" id="promo-code-input" placeholder="e.g., ARBRAINPRO" class="input-native flex-1 border border-gray-200 dark:border-[#27272a]" style="padding: 10px 14px;">
                            <button onclick="window.redeemCode()" class="bg-gray-900 dark:bg-white text-white dark:text-black px-5 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-lg">Apply</button>
                        </div>
                    </div>

                    <h3 class="font-bold text-xl tracking-tight mb-4">Locked Content</h3>
                    <div class="grid grid-cols-1 gap-4" id="premium-list-container"></div>
                </div>

                <div id="tab-profile" class="p-5 hidden">
                    <div class="flex flex-col items-center mb-8 mt-4">
                        <div class="relative group cursor-pointer" onclick="window.openEditProfile()">
                            <div class="w-24 h-24 rounded-full border-4 border-[#f4f4f5] dark:border-dark-bg bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 shadow-lg overflow-hidden flex items-center justify-center relative">
                                <img id="profile-avatar-img" src="" class="w-full h-full object-cover" referrerpolicy="no-referrer">
                                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i class="fa-solid fa-camera text-white"></i>
                                </div>
                            </div>
                            <div class="absolute bottom-0 right-0 w-8 h-8 bg-brand-500 rounded-full border-2 border-[#f4f4f5] dark:border-dark-bg flex items-center justify-center shadow-md">
                                <i class="fa-solid fa-pen text-white text-[11px]"></i>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-4">
                            <h2 class="text-2xl font-extrabold tracking-tight" id="profile-name">User</h2>
                        </div>
                        <p class="text-sm font-medium text-gray-500 mt-1" id="profile-status">Free Member</p>
                    </div>

                    <div class="flex gap-4 mb-8">
                        <div class="flex-1 card-glass p-4 rounded-2xl text-center">
                            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-star text-lg"></i> <span id="profile-xp">0</span>
                            </div>
                            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total XP</p>
                        </div>
                        <div class="flex-1 card-glass p-4 rounded-2xl text-center">
                            <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1" id="profile-favs">0</div>
                            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Saved Items</p>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="font-bold text-xs text-gray-500 uppercase tracking-wider px-2 mb-2">Account</h3>
                        
                        <button onclick="window.openGuide()" class="w-full card-glass p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"><i class="fa-solid fa-book-open text-sm"></i></div>
                                <span class="font-semibold text-sm">How to Earn XP?</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-sm"></i>
                        </button>

                        <button onclick="window.switchTab('videos'); document.getElementById('video-search').value=''; window.filterVideos();" class="w-full card-glass p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"><i class="fa-solid fa-bookmark text-sm"></i></div>
                                <span class="font-semibold text-sm">My Favorites</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-sm"></i>
                        </button>
                        
                        <h3 class="font-bold text-xs text-gray-500 uppercase tracking-wider px-2 mb-2 mt-6">Support & Info</h3>

                        <button onclick="window.openHelp()" class="w-full card-glass p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"><i class="fa-solid fa-life-ring text-sm"></i></div>
                                <span class="font-semibold text-sm">Help Center</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-sm"></i>
                        </button>

                        <button onclick="window.openReport()" class="w-full card-glass p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"><i class="fa-solid fa-bullhorn text-sm"></i></div>
                                <span class="font-semibold text-sm">Report a Problem</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-sm"></i>
                        </button>

                        <button onclick="window.openAbout()" class="w-full card-glass p-4 rounded-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center"><i class="fa-solid fa-info-circle text-sm"></i></div>
                                <span class="font-semibold text-sm">About</span>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-300 dark:text-gray-600 text-sm"></i>
                        </button>

                        <button onclick="window.logout()" class="w-full mt-6 p-4 rounded-2xl flex justify-center items-center active:scale-[0.98] transition-transform bg-gray-100 dark:bg-gray-800 text-red-500">
                            <span class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out</span>
                        </button>
                    </div>
                </div>

            </main>

            <nav class="glass fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pb-safe shadow-[0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-none border-t border-gray-200 dark:border-[#27272a] transition-all duration-300">
                <div class="flex justify-around items-center pt-2 pb-1 px-2">
                    <button onclick="window.switchTab('home')" class="nav-btn active flex flex-col items-center gap-1 p-2 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 active:scale-90" data-target="home">
                        <i class="fa-solid fa-house text-xl mb-0.5"></i>
                        <span class="text-[10px] font-semibold tracking-wide">Home</span>
                    </button>
                    <button onclick="window.switchTab('videos')" class="nav-btn flex flex-col items-center gap-1 p-2 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 active:scale-90" data-target="videos">
                        <i class="fa-solid fa-play-circle text-xl mb-0.5"></i>
                        <span class="text-[10px] font-semibold tracking-wide">Watch</span>
                    </button>
                    <button onclick="window.switchTab('premium')" class="nav-btn flex flex-col items-center gap-1 p-2 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 active:scale-90" data-target="premium">
                        <i class="fa-solid fa-crown text-xl mb-0.5"></i>
                        <span class="text-[10px] font-semibold tracking-wide">Pro</span>
                    </button>
                    <button onclick="window.switchTab('profile')" class="nav-btn flex flex-col items-center gap-1 p-2 w-16 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 active:scale-90" data-target="profile">
                        <i class="fa-solid fa-user text-xl mb-0.5"></i>
                        <span class="text-[10px] font-semibold tracking-wide">Profile</span>
                    </button>
                </div>
            </nav>
        </div>

        <div id="modal-video" class="absolute inset-0 z-50 bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe">
                <button onclick="window.closeModal('video')" class="flex items-center justify-center w-10 h-10 active:opacity-50 transition-opacity">
                    <i class="fa-solid fa-chevron-down text-xl text-gray-900 dark:text-white"></i>
                </button>
                <div class="flex gap-2">
                    <button id="modal-fav-btn" class="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center active:scale-90 transition-transform text-gray-900 dark:text-white">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                    <button onclick="window.shareContent()" class="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center active:scale-90 transition-transform text-gray-900 dark:text-white">
                        <i class="fa-solid fa-arrow-up-from-bracket"></i>
                    </button>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-safe flex flex-col">
                <div class="p-4 md:p-5 flex-1 flex flex-col">
                    <div class="mb-2">
                        <h2 id="modal-title" class="text-2xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">Video Title</h2>
                    </div>

                    <div class="flex p-1 bg-gray-100 dark:bg-dark-surface rounded-xl mb-4 mt-2 overflow-x-auto no-scrollbar shrink-0">
                        <button onclick="window.setModalTab('video')" id="mtab-video" class="flex-1 min-w-[80px] py-2 text-sm font-semibold rounded-lg bg-white dark:bg-[#27272a] shadow-sm text-gray-900 dark:text-white transition-all whitespace-nowrap px-3">Video</button>
                        <button onclick="window.setModalTab('prompt')" id="mtab-prompt" class="flex-1 min-w-[80px] py-2 text-sm font-medium text-gray-500 transition-all rounded-lg whitespace-nowrap px-3 hidden">Prompt</button>
                        <button onclick="window.setModalTab('code')" id="mtab-code" class="flex-1 min-w-[90px] py-2 text-sm font-medium text-gray-500 transition-all rounded-lg whitespace-nowrap px-3 hidden">Source Code</button>
                    </div>

                    <div id="mcontent-video" class="flex flex-col gap-4 flex-1 overflow-y-auto no-scrollbar">
                        <div id="modal-player" class="w-full bg-black video-container shrink-0 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-[#27272a]">
                            <div id="iframe-container"></div>
                        </div>
                        <div id="mcontent-desc" class="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed block bg-gray-50 dark:bg-[#18181b] p-4 rounded-2xl border border-gray-100 dark:border-[#27272a]"></div>
                    </div>

                    <div id="mcontent-prompt" class="hidden flex-col gap-5 flex-1">
                        <div class="flex items-start gap-3 w-full">
                            <div class="flex-1 overflow-hidden flex flex-col">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Prompt Data</span>
                                    <button onclick="window.copyData('modal-prompt-text')" class="bg-gray-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1.5"><i class="fa-regular fa-copy"></i> Copy Prompt</button>
                                </div>
                                <div class="bg-gray-100 dark:bg-[#18181b] text-gray-900 dark:text-gray-200 p-4 rounded-2xl text-sm leading-relaxed border border-gray-200 dark:border-[#27272a] overflow-x-auto relative">
                                    <p id="modal-prompt-text" class="whitespace-pre-wrap font-medium font-mono text-[13px]"></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="mcontent-code" class="hidden flex-col gap-5 flex-1">
                        <div id="code-unlocked" class="hidden flex-col gap-5">
                            <div class="flex items-start gap-3 w-full">
                                <div class="flex-1 overflow-hidden flex flex-col">
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Source Code</span>
                                        <button onclick="window.copyData('modal-source-code')" class="bg-gray-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1.5"><i class="fa-regular fa-copy"></i> Copy Code</button>
                                    </div>
                                    <div class="bg-gray-100 dark:bg-[#18181b] text-gray-900 dark:text-gray-200 p-4 rounded-2xl text-sm leading-relaxed border border-gray-200 dark:border-[#27272a] overflow-x-auto relative">
                                        <p id="modal-source-code" class="whitespace-pre-wrap font-medium font-mono text-[13px]"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div id="modal-edit-profile" class="absolute inset-0 z-[60] bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe border-b border-gray-200 dark:border-[#27272a]">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Edit Profile</h2>
                <button onclick="window.closeEditProfile()" class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-surface rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-safe p-6 flex flex-col items-center">
                <div class="relative mb-8 mt-4">
                    <div class="w-28 h-28 rounded-full border-4 border-gray-100 dark:border-dark-surface shadow-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                        <img id="edit-avatar-preview" src="" class="w-full h-full object-cover">
                    </div>
                    <label class="absolute bottom-0 right-0 w-10 h-10 bg-brand-500 rounded-full border-4 border-white dark:border-dark-bg flex items-center justify-center text-white cursor-pointer shadow-md active:scale-90 transition-transform">
                        <i class="fa-solid fa-camera text-sm"></i>
                        <input type="file" id="edit-avatar-input" accept="image/*" class="hidden" onchange="window.handleAvatarSelect(event)">
                    </label>
                </div>

                <div class="w-full space-y-5">
                    <div>
                        <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                        <input type="text" id="edit-name" class="input-native border border-gray-200 dark:border-[#27272a]" placeholder="Your Name">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                        <input type="email" id="edit-email" class="input-native border border-gray-200 dark:border-[#27272a] opacity-60 cursor-not-allowed" disabled readonly>
                    </div>
                    
                    <button onclick="window.saveProfile()" id="save-profile-btn" class="w-full py-4 mt-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:scale-100">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>

        <div id="modal-guide" class="absolute inset-0 z-[60] bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe border-b border-gray-200 dark:border-[#27272a]">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">How to Earn XP</h2>
                <button onclick="window.closeGuide()" class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-surface rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-safe p-6 flex flex-col gap-6">
                <div class="flex gap-4 items-start">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 text-xl"><i class="fa-brands fa-youtube"></i></div>
                    <div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Watch Full Videos</h3>
                        <p class="text-gray-500 text-sm mt-1 leading-relaxed">Earn <strong>+15 XP</strong> by watching any tutorial to the very end. <span class="text-red-500 font-medium">Warning:</span> Skipping or fast-forwarding the video will void the reward!</p>
                    </div>
                </div>
                <div class="flex gap-4 items-start">
                    <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 text-xl"><i class="fa-solid fa-unlock"></i></div>
                    <div>
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white">Unlock Source Codes</h3>
                        <p class="text-gray-500 text-sm mt-1 leading-relaxed">Use your earned XP to permanently unlock Premium Source Codes (Costs exactly 400 XP each). Tutorials and Prompts are completely free!</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-help" class="absolute inset-0 z-[60] bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe border-b border-gray-200 dark:border-[#27272a]">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Help Center</h2>
                <button onclick="window.closeHelp()" class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-surface rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-safe p-6">
                <h3 class="font-bold text-xl mb-4">Frequently Asked Questions</h3>
                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white mb-1">How do I unlock Source Codes?</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Source codes are premium and require 400 XP to unlock. Earn XP by watching videos.</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white mb-1">I didn't receive XP for watching?</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Our system detects video skips. Ensure you watch the video from start to finish without fast-forwarding to earn your 15 XP.</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl border border-[#27272a]">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white mb-1">Contact Support</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Need more help? Email us directly at <strong class="text-brand-500">arbarincode.app@gmail.com</strong> and our team will assist you within 24 hours.</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-report" class="absolute inset-0 z-[60] bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe border-b border-gray-200 dark:border-[#27272a]">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Report a Problem</h2>
                <button onclick="window.closeReport()" class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-surface rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto pb-safe p-6 flex flex-col">
                <p class="text-sm text-gray-500 mb-4">Please describe the issue you are facing in detail. Our team will review it shortly.</p>
                <textarea id="report-text" rows="6" class="input-native border border-gray-200 dark:border-[#27272a] resize-none" placeholder="Explain your problem here..."></textarea>
                
                <button onclick="window.submitReport()" class="w-full py-4 mt-6 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-base active:scale-[0.98] transition-all shadow-lg">
                    Submit Report
                </button>
            </div>
        </div>

        <div id="modal-about" class="absolute inset-0 z-[60] bg-white dark:bg-dark-bg hidden flex-col translate-y-full transition-transform duration-200">
            <div class="glass flex items-center justify-between px-4 py-3 sticky top-0 z-10 pt-safe border-b border-gray-200 dark:border-[#27272a]">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white tracking-tight">About</h2>
                <button onclick="window.closeAbout()" class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-dark-surface rounded-full text-gray-600 dark:text-gray-300 active:scale-90 transition-transform">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto pb-safe p-6 flex flex-col items-center justify-center text-center">
                <img src="https://uploads.onecompiler.io/43d4xt63k/44eepue29/PHOTO-2026-02-23-13-07-30.jpg" alt="Logo" class="w-24 h-24 object-cover rounded-full shadow-lg mb-4" referrerpolicy="no-referrer">
                <h3 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">AR BRAINCODE</h3>
                <p class="text-gray-500 mb-8 font-medium">Version 1.0.0</p>
                <div class="bg-gray-50 dark:bg-dark-surface w-full p-6 rounded-2xl border border-gray-100 dark:border-dark-border">
                    <p class="text-sm text-gray-600 dark:text-gray-300">Developed by</p>
                    <p class="text-lg font-bold text-brand-500 mt-1 tracking-widest uppercase">ARINFOTECH</p>
                </div>
            </div>
        </div>
    </div>
  `;

  return <div className="h-full w-full flex flex-col" dangerouslySetInnerHTML={{ __html: rawHTML }} />;
}
