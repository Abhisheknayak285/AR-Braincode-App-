import React, { useEffect, useRef } from 'react';
import './index.css';

export default function App() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAppLogic = () => {
        if (!window.firebase || !window.firebase.apps) {
            setTimeout(initAppLogic, 50); 
            return;
        }

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
        
        // AD VARIABLES
        window.hasShownAd = false;
        window.adTimerInterval = null;

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
            }).catch((error) => { window.showToast("Error: " + error.message, 3000); btn.disabled = false; btn.innerText = "Send Reset Link"; });
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
                    }).catch(err => { window.showToast("Failed to send OTP. Try again."); window.setButtonLoading(false, "Register & Send Code"); });
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
                                    isPremium: false, xp: 0, unlockedItems: [], favorites: [], usedPromos: [], xpHistory: [], lastDaily: 0, isBlocked: false
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

        window.routeApp = function() {
            if (!window.appState.currentUserUid) {
                document.getElementById('view-auth').classList.remove('hidden'); document.getElementById('view-auth').classList.add('flex');
                document.getElementById('view-main').classList.add('hidden'); document.getElementById('view-main').classList.remove('flex');
            } else {
                document.getElementById('view-auth').classList.add('hidden'); document.getElementById('view-auth').classList.remove('flex');
                document.getElementById('view-main').classList.remove('hidden'); document.getElementById('view-main').classList.add('flex');
                window.updateUI(); window.renderAll();
                
                // CHECK AND SHOW AD
                if (!window.hasShownAd) {
                    window.hasShownAd = true;
                    setTimeout(() => { window.showStartupAd(); }, 600);
                }
            }
        }

        // --- NEW AD LOGIC ---
        window.showStartupAd = function() {
            const modal = document.getElementById('modal-startup-ad');
            const box = document.getElementById('ad-content-box');
            const timerText = document.getElementById('ad-timer-text');
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                box.classList.remove('scale-95');
            }, 10);

            let timeLeft = 5;
            timerText.innerText = timeLeft;
            
            clearInterval(window.adTimerInterval);
            window.adTimerInterval = setInterval(() => {
                timeLeft--;
                if(timeLeft >= 0) { timerText.innerText = timeLeft; }
                if (timeLeft <= 0) { window.closeStartupAd(); }
            }, 1000);
        }

        window.closeStartupAd = function() {
            clearInterval(window.adTimerInterval);
            const modal = document.getElementById('modal-startup-ad');
            const box = document.getElementById('ad-content-box');
            
            modal.classList.add('opacity-0');
            box.classList.add('scale-95');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }

        window.switchTab = function(tabId) {
            ['home', 'videos', 'premium', 'profile'].forEach(tab => {
                document.getElementById(`tab-${tab}`).classList.add('hidden'); document.getElementById(`tab-${tab}`).classList.remove('block');
            });
            document.getElementById(`tab-${tabId}`).classList.remove('hidden'); document.getElementById(`tab-${tabId}`).classList.add('block');
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if(btn.dataset.target === tabId) { btn.classList.add('text-gray-900', 'dark:text-white'); btn.classList.remove('text-gray-400'); } 
                else { btn.classList.remove('text-gray-900', 'dark:text-white'); btn.classList.add('text-gray-400'); }
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
            } catch (e) { window.showToast(e.message || "Failed to update profile."); } finally { btn.disabled = false; btn.innerText = "Save Changes"; }
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
                .then(() => { window.showToast('Source Code Unlocked Successfully! 🎉'); window.renderPremium(); });
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
                    const user = window.getCurrentUser(); 
                    const newXp = (user.xp || 0) + 50;
                    user.xpHistory = user.xpHistory || [];
                    user.xpHistory.unshift({ id: Date.now(), type: 'video', amount: 50, date: new Date().toISOString() });
                    
                    db.collection('users').doc(window.appState.currentUserUid).update({ xp: newXp, xpHistory: user.xpHistory }); 
                    window.showToast('+50 XP for watching full video! ⚡');
                    window.updateUI(); 
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
                    
                    user.xp = (user.xp || 0) + promoData.xp; 
                    user.usedPromos.push(input);
                    
                    user.xpHistory = user.xpHistory || [];
                    user.xpHistory.unshift({ id: Date.now(), type: 'promo', amount: promoData.xp, code: input, date: new Date().toISOString() });

                    await db.collection('users').doc(window.appState.currentUserUid).update({ xp: user.xp, usedPromos: user.usedPromos, xpHistory: user.xpHistory });
                    window.showToast(`+${promoData.xp} XP added! 🎉`); document.getElementById('promo-code-input').value = '';
                    window.updateUI(); 
                } else { window.showToast('Invalid Code.'); }
            } catch(e) { window.showToast('Error validating code.'); }
        }

        window.openXpHistory = function() {
            const user = window.getCurrentUser();
            const container = document.getElementById('xp-history-list');
            container.innerHTML = '';
            
            if(!user || !user.xpHistory || user.xpHistory.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-sm font-medium">No XP history found yet.<br>Watch videos or redeem codes to earn XP!</div>';
            } else {
                user.xpHistory.forEach(item => {
                    let icon = item.type === 'video' ? '<i class="fa-brands fa-youtube text-red-500"></i>' : '<i class="fa-solid fa-ticket text-brand-500"></i>';
                    let title = item.type === 'video' ? 'Video Reward' : 'Promo Code';
                    let desc = item.type === 'video' ? 'Watched full tutorial' : `Code: ${item.code || 'REDEEMED'}`;
                    
                    let dateObj = new Date(item.date);
                    let dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    
                    container.innerHTML += `
                        <div class="card-glass p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-[#27272a]">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                    ${icon}
                                </div>
                                <div>
                                    <h4 class="font-bold text-sm text-gray-900 dark:text-white leading-tight">${title}</h4>
                                    <p class="text-[11px] text-gray-500 font-medium mt-0.5">${desc} • ${dateStr}</p>
                                </div>
                            </div>
                            <div class="font-extrabold text-brand-500">+${item.amount} <span class="text-[10px] text-gray-400">XP</span></div>
                        </div>
                    `;
                });
            }
            
            const modal = document.getElementById('modal-xp-history');
            modal.classList.remove('hidden'); modal.classList.add('flex');
            setTimeout(() => { modal.classList.remove('translate-y-full'); }, 10);
        }

        window.closeXpHistory = function() {
            const modal = document.getElementById('modal-xp-history');
            modal.classList.add('translate-y-full');
            setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
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
                        window.appState.currentUserProfile.xpHistory = window.appState.currentUserProfile.xpHistory || []; 
                        
                        if(window.appState.currentUserProfile.isBlocked) { auth.signOut(); window.showToast("Your account has been blocked by the administrator."); return; }
                        window.updateUI(); document.getElementById('view-loading').classList.add('hidden'); window.routeApp();
                    } else {
                        const finalName = user.displayName || "Developer"; const defaultAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=14b8a6&color=fff`;
                        db.collection('users').doc(user.uid).set({ name: finalName, email: user.email, avatar: defaultAvatar, isPremium: false, xp: 0, unlockedItems: [], favorites: [], usedPromos: [], xpHistory: [], lastDaily: 0, isBlocked: false });
                    }
                });
            } else {
                if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
                window.appState.currentUserUid = null; window.appState.currentUserProfile = null;
                setTimeout(() => { document.getElementById('view-loading').classList.add('hidden'); window.routeApp(); }, 600);
            }
        });
    }

    initAppLogic(); 
  }, []);

  return null; 
}
