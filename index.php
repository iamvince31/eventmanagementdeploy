<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Event Management</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Simple Event Management</h1>

    <div id="authSection">
        <section id="loginSection">
            <h2>Login</h2>
            <form id="loginForm">
                <label>Email: <input type="email" name="email" required></label><br>
                <label>Password: <input type="password" name="password" required></label><br>
                <button type="submit" class="btn">Login</button>
                <button type="button" class="btn" id="toggleToRegister">Don't have an account? Register</button>
            </form>
            <div id="loginResult"></div>
        </section>

        <section id="registerSection" style="display:none;">
            <h2>Register</h2>
            <form id="registerForm">
                <label>Username: <input type="text" name="username" required></label><br>
                <label>Email: <input type="email" name="email" required></label><br>
                <label>Password: <input type="password" name="password" required></label><br>
                <label>Confirm Password: <input type="password" name="confirmPassword" required></label><br>
                <button type="submit" class="btn">Register</button>
                <button type="button" class="btn" id="toggleToLogin">Already have an account? Login</button>
            </form>
            <div id="registerResult"></div>
        </section>
    </div>

    <div id="appSection" style="display:none;">
        <div id="userInfo" style="text-align:right; margin-bottom:12px;">
            <span id="currentUser"></span>
            <button id="logoutBtn" class="btn">Logout</button>
        </div>

        <section>
            <h2>Create Event / Invite Members</h2>
            <form id="eventForm">
                <label>Title: <input type="text" name="title" required></label><br>
                <label>Description:<br>
                    <textarea name="description" rows="3" placeholder="Event details..."></textarea>
                </label><br>
                <label>Department:<br>
                    <select name="department">
                        <option value="">-- Select Department --</option>
                        <option value="HR">HR</option>
                        <option value="IT">IT</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                </label><br>
                <label>Date: <input type="date" name="date" required></label><br>
                <label>Time: <input type="time" name="time" required></label><br>
                <label>Members:<br>
                    <select id="membersList" name="members" multiple size="5">
                        <option value="">Loading members...</option>
                    </select>
                </label><br>
                <small style="color:#666;">Hold Ctrl/Cmd to select multiple members</small><br>
                <label>
                    <input type="checkbox" name="isOpen"> Open Event (everyone can join)
                </label><br>
                <button type="submit" class="btn">Create Event</button>
            </form>
            <div id="createResult"></div>
        </section>

        <hr>

        <section>
            <h2>Events / Calendar</h2>
            <button id="refreshEvents" class="btn">Refresh Events</button>
            <div id="eventsList"></div>
        </section>

        <hr>
        <!--  
        <section>
            <h2>Member Availability (mark busy)</h2>
            <form id="availForm">
                <label>Member name:<br>
                    <select id="memberAvailList" name="member" required>
                        <option value="">Loading members...</option>
                    </select>
                </label><br>
                <label>Date: <input type="date" name="date" required></label><br>
                <label>Start time: <input type="time" name="start" required></label><br>
                <label>End time: <input type="time" name="end" required></label><br>
                <button type="submit" class="btn">Mark Busy</button>
            </form>
            <div id="availResult"></div>
        </section>
       -->
    </div>

    <script>
    // Helper: POST form data to api.php
    async function postAction(data){
        const resp = await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });
        return resp.json();
    }

    // Auth form handlers
    document.getElementById('loginForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {action:'login', email:fd.get('email'), password:fd.get('password')};
        const res = await postAction(data);
        if(res.error){ document.getElementById('loginResult').textContent = 'Error: ' + res.error; }
        else { document.getElementById('loginResult').textContent = res.message; checkAuth(); }
    });

    document.getElementById('registerForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        if(fd.get('password') !== fd.get('confirmPassword')){ document.getElementById('registerResult').textContent = 'Passwords do not match'; return; }
        const data = {action:'register', username:fd.get('username'), email:fd.get('email'), password:fd.get('password')};
        const res = await postAction(data);
        if(res.error){ document.getElementById('registerResult').textContent = 'Error: ' + res.error; }
        else { 
            document.getElementById('registerResult').textContent = res.message + ' Please login with your credentials.';
            document.getElementById('registerForm').reset();
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('registerSection').style.display = 'none';
        }
    });

    document.getElementById('toggleToRegister').addEventListener('click', ()=>{
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('registerSection').style.display = 'block';
    });

    document.getElementById('toggleToLogin').addEventListener('click', ()=>{
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('registerSection').style.display = 'none';
    });

    document.getElementById('logoutBtn').addEventListener('click', async ()=>{
        await postAction({action:'logout'});
        checkAuth();
    });

    // Load members from users via get_registered_members
    async function loadMembers(){
        const res = await postAction({action:'get_registered_members'});
        const select = document.getElementById('membersList');
        select.innerHTML = '';
        if(res.members && res.members.length > 0){
            res.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.email; // store email as value for creating events
                opt.textContent = m.username; // display username
                select.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.textContent = 'No members available';
            select.appendChild(opt);
        }
    }

    // Load members for availability form (commented out for now)
    // async function loadMembersForAvailability(){
    //     const res = await postAction({action:'list_members'});
    //     const select = document.getElementById('memberAvailList');
    //     select.innerHTML = '';
    // }

    // Cache for email to username mapping
    let membersCache = null;

    // Check auth and show appropriate section
    async function checkAuth(){
        const res = await postAction({action:'get_current_user'});
        const user = res.user;
        if(user){
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('appSection').style.display = 'block';
            document.getElementById('currentUser').textContent = 'Logged in as: ' + (user.username || user.email);
            loadMembers();
            // loadMembersForAvailability(); // commented out - availability form not in use
            refreshEvents();
        } else {
            document.getElementById('authSection').style.display = 'block';
            document.getElementById('appSection').style.display = 'none';
        }
    }

    // Create event
    document.getElementById('eventForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const date = fd.get('date');
        const time = fd.get('time');
        
        // Validate date/time not in past
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
        
        if(date < today || (date === today && time < currentTime)){
            document.getElementById('createResult').textContent = 'Error: Cannot set event in the past. Event time must be today or later.';
            return;
        }
        
        const memberSelect = document.getElementById('membersList');
        const members = Array.from(memberSelect.selectedOptions).map(opt => opt.value);
        const isOpen = fd.get('isOpen') ? true : false;
        const data = {
            action:'create_event',
            title:fd.get('title'),
            description:fd.get('description'),
            department:fd.get('department'),
            date:date,
            time:time,
            members:members,
            isOpen:isOpen
        };
        const res = await postAction(data);
        document.getElementById('createResult').textContent = res.message || JSON.stringify(res);
        if(res.message && res.message.includes('created')) e.target.reset();
        refreshEvents();
    });

    // Mark availability (busy) - commented out for now
    // const availForm = document.getElementById('availForm');
    // if(availForm) {
    //     availForm.addEventListener('submit', async e => {
    //         e.preventDefault();
    //         const fd = new FormData(e.target);
    //         const data = {action:'set_availability', member:fd.get('member'), date:fd.get('date'), start:fd.get('start'), end:fd.get('end')};
    //         const res = await postAction(data);
    //         document.getElementById('availResult').textContent = res.message || JSON.stringify(res);
    //         refreshEvents();
    //     });
    // }

    document.getElementById('refreshEvents').addEventListener('click', refreshEvents);

    // Helper to map email to username
    async function getEmailToUsernameMap(){
        if(!membersCache){
            const res = await postAction({action:'get_registered_members'});
            membersCache = {};
            if(res.members){
                res.members.forEach(m => {
                    membersCache[m.email] = m.username;
                });
            }
        }
        return membersCache;
    }

    async function refreshEvents(){
        const res = await postAction({action:'list_events'});
        const container = document.getElementById('eventsList');
        if(!res.events) { container.textContent = JSON.stringify(res); return; }
        container.innerHTML = '';
        if(res.events.length===0){ container.textContent = 'No events yet.'; return; }
        const emailToUsername = await getEmailToUsernameMap();
        for(const ev of res.events){
            const div = document.createElement('div');
            div.className = 'event-card';
            const h = document.createElement('h3');
            h.textContent = ev.title + ' — ' + ev.date + ' ' + ev.time;
            div.appendChild(h);
            const info = document.createElement('div');
            info.style.fontSize = '0.9rem';
            info.style.marginBottom = '8px';
            let infoHtml = '';
            if(ev.description) infoHtml += '<p><strong>Description:</strong> ' + ev.description + '</p>';
            if(ev.department) infoHtml += '<p><strong>Department:</strong> ' + ev.department + '</p>';
            if(ev.isOpen) infoHtml += '<p style="color:green;"><strong>Open Event</strong> - Everyone can join</p>';
            info.innerHTML = infoHtml;
            div.appendChild(info);
            const ul = document.createElement('ul');
            ul.innerHTML = '<strong>Members:</strong>';
            for(const m of ev.members){
                const li = document.createElement('li');
                const username = emailToUsername[m] || m;
                li.textContent = username + ' — checking...';
                li.className = 'checking';
                ul.appendChild(li);
                // check availability per member
                (async ()=>{
                    const av = await postAction({action:'get_member_availability_for_event', event_id:ev.id, member:m});
                    li.textContent = m + ' — ' + (av.available? 'Available' : ('Busy at ' + av.busy_reason));
                    li.className = av.available ? 'member-available' : 'member-busy';
                })();
            }
            div.appendChild(ul);
            container.appendChild(div);
        }
    }

    // Check auth on page load
    checkAuth();
    </script>

</body>
</html>