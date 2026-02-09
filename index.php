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
                <label>Date: <input type="date" name="date" required></label><br>
                <label>Time: <input type="time" name="time" required></label><br>
                <label>Members:<br>
                    <select id="membersList" name="members" multiple size="5" required>
                        <option value="">Loading members...</option>
                    </select>
                </label><br>
                <small style="color:#666;">Hold Ctrl/Cmd to select multiple members</small><br>
                <button type="submit" class="btn">Create Event & Invite</button>
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

        <section>
            <h2>Member Availability (mark busy)</h2>
            <form id="availForm">
                <label>Member name/email: <input type="text" name="member" required></label><br>
                <label>Date: <input type="date" name="date" required></label><br>
                <label>Start time: <input type="time" name="start" required></label><br>
                <label>End time: <input type="time" name="end" required></label><br>
                <button type="submit" class="btn">Mark Busy</button>
            </form>
            <div id="availResult"></div>
        </section>
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
        else { document.getElementById('registerResult').textContent = res.message; checkAuth(); }
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

    // Load members from members.json via list_members
    async function loadMembers(){
        const res = await postAction({action:'list_members'});
        const select = document.getElementById('membersList');
        select.innerHTML = '';
        if(res.members && res.members.length > 0){
            res.members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; // members.json stores identifiers (email or name)
                opt.textContent = m;
                select.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.textContent = 'No members available';
            select.appendChild(opt);
        }
    }

    // Check auth and show appropriate section
    async function checkAuth(){
        const res = await postAction({action:'get_current_user'});
        const user = res.user;
        if(user){
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('appSection').style.display = 'block';
            document.getElementById('currentUser').textContent = 'Logged in as: ' + user.email;
            loadMembers();
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
        const memberSelect = document.getElementById('membersList');
        const members = Array.from(memberSelect.selectedOptions).map(opt => opt.value);
        const data = {action:'create_event', title:fd.get('title'), date:fd.get('date'), time:fd.get('time'), members};
        const res = await postAction(data);
        document.getElementById('createResult').textContent = res.message || JSON.stringify(res);
        refreshEvents();
    });

    // Mark availability (busy)
    document.getElementById('availForm').addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {action:'set_availability', member:fd.get('member'), date:fd.get('date'), start:fd.get('start'), end:fd.get('end')};
        const res = await postAction(data);
        document.getElementById('availResult').textContent = res.message || JSON.stringify(res);
        refreshEvents();
    });

    document.getElementById('refreshEvents').addEventListener('click', refreshEvents);

    async function refreshEvents(){
        const res = await postAction({action:'list_events'});
        const container = document.getElementById('eventsList');
        if(!res.events) { container.textContent = JSON.stringify(res); return; }
        container.innerHTML = '';
        if(res.events.length===0){ container.textContent = 'No events yet.'; return; }
        for(const ev of res.events){
            const div = document.createElement('div');
            div.className = 'event-card';
            const h = document.createElement('h3');
            h.textContent = ev.title + ' — ' + ev.date + ' ' + ev.time;
            div.appendChild(h);
            const ul = document.createElement('ul');
            for(const m of ev.members){
                const li = document.createElement('li');
                li.textContent = m + ' — checking...';
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