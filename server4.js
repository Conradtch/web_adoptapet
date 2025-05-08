const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname +'/images'));
app.use(session({
    secret: 'secret-key',
}));



// Template rendering function
function Template(content) {
    const header = fs.readFileSync(path.join(__dirname, 'header.html'), 'utf8');
    const footer = fs.readFileSync(path.join(__dirname, 'footer.html'), 'utf8');

    return header + content + footer;
}

// Authentication middleware
function requireLogin(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Routes (same as before)
app.get('/', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.send(Template(content));
});
app.get('/index.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.send(Template(content));
});
app.get('/find.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'find.html'), 'utf8');
    res.send(Template(content));
});
app.get('/cat-care.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'cat-care.html'), 'utf8');
    res.send(Template(content));
});
app.get('/contact.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'contact.html'), 'utf8');
    res.send(Template(content));
});
app.get('/dog-care.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'dog-care.html'), 'utf8');
    res.send(Template(content));
});
app.get('/give-away.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'give-away.html'), 'utf8');
    res.send(Template(content));
});
app.get('/pets.html', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'pets.html'), 'utf8');
    res.send(Template(content));
});

// Create Account
app.get('/create-account', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname,'create-account.html'), 'utf8');
    res.send(Template(content));
});

app.post('/create-account', (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
    
    if (!usernameRegex.test(username) || !passwordRegex.test(password)) {
        return res.send(Template(`
            <main>
            <div class="error">
                <h2>Account Creation Failed</h2>
                <p>Username must contain only letters and numbers.</p>
                <p>Password must be at least 4 characters with at least one letter and one number.</p>
                <a href="/create-account">Try again</a>
            </div>
            </main>
        `));
    }
    
    // Check if username exists
    const users = fs.readFileSync(path.join(__dirname, 'data', 'users.txt'), 'utf8').split('\n');
    const userExists = users.some(line => {
        const [existingUser] = line.split(':');
        return existingUser === username;
    });
    
    if (userExists) {
        return res.send(Template(`
            <main>
            <div class="error">
                <h2>Account Creation Failed</h2>
                <p>Username already exists. Please choose a different username.</p>
                <a href="/create-account">Try again</a>
            </div>
            </main>
        `));
    }
    
    // Create new account
    fs.appendFileSync(path.join(__dirname, 'data', 'users.txt'), `${username}:${password}\n`);
    res.send(Template(`
        <main>
        <div class="success">
            <h2>Account Created Successfully</h2>
            <p>You can now <a href="/login">login</a> to your account.</p>
        </div>
        </main>
    `));
});

// Login
app.get('/login', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf8');
    res.send(Template(content));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const users = fs.readFileSync(path.join(__dirname, 'data', 'users.txt'), 'utf8').split('\n');
    const validUser = users.some(line => {
        const [existingUser, existingPass] = line.split(':');
        return existingUser === username && existingPass === password;
    });
    
    if (validUser) {
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/give-away');
    } else {
        res.send(Template(`
            <main>
            <div class="error">
                <h2>Login Failed</h2>
                <p>Invalid username or password.</p>
                <a href="/login">Try again</a>
            </div>
            </main>
        `));
    }
});




// Have a Pet to Give Away
app.get('/give-away', requireLogin, (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'give-away.html'), 'utf8');
    res.send(Template(content));
});

app.post('/give-away', requireLogin, (req, res) => {
    const { petType, breed, age, gender, goodWith, description } = req.body;
    
    // Read current pets to get next ID
    const pets = fs.readFileSync(path.join(__dirname, 'data', 'pets.txt'), 'utf8')
        .split('\n')
        .filter(line => line.trim());
    const nextId = pets.length + 1;
    
    // Create pet record
    const petRecord = [
        nextId,
        req.session.username,
        petType,
        breed,
        age,
        gender,
        goodWith || 'N/A',
        description
    ].join(':');
    
    // Save to file
    fs.appendFileSync(path.join(__dirname, 'data', 'pets.txt'), petRecord + '\n');
    
    res.send(Template(`
        <main>
        <div class="success">
            <h2>Pet Listing Created</h2>
            <p>Thank you for listing your pet for adoption!</p>
            <p><a href="/give-away">List another pet</a> or <a href="/">return home</a></p>
        </div>
        </main>
    `));
});




// Find a Pet
app.get('/find', (req, res) => {
    const content = fs.readFileSync(path.join(__dirname, 'find.html'), 'utf8');
    res.send(Template(content));
});

app.post('/find', (req, res) => {
    const { petType, breed, age, gender, goodWith } = req.body;
    
    const pets = fs.readFileSync(path.join(__dirname, 'data', 'pets.txt'), 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [id, owner, type, breed, age, gender, goodWith, description] = line.split(':');
            return { id, owner, petType: type, breed, age, gender, goodWith, description };
        });
    
    // Filter pets based on search criteria
    const filteredPets = pets.filter(pet => {
        if (petType && pet.petType !== petType) return false;
        if (breed && !pet.breed.toLowerCase().includes(breed.toLowerCase())) return false;
        if (age) {
            const petAge = parseFloat(pet.age);
            if (age === '0-1' && (petAge < 0 || petAge > 1)) return false;
            if (age === '1-5' && (petAge < 1 || petAge > 5)) return false;
            if (age === '5+' && petAge < 5) return false;
        }
        if (gender && pet.gender !== gender) return false;
        if (goodWith && pet.goodWith !== goodWith) return false;
        return true;
    });
    
    let resultsContent;
    if (filteredPets.length === 0) {
        resultsContent = '<main> <p>No pets found matching your criteria.</p></main>';
    } else {
        resultsContent = `
        <main>
            <h2>Available Pets</h2>
            <div class="pet-list">
                ${filteredPets.map(pet => `
                    <div class="pet-card">
                        <h3>${pet.petType} ${pet.breed}</h3>
                        <p><strong>Age:</strong> ${pet.age} years</p>
                        <p><strong>Gender:</strong> ${pet.gender}</p>
                        <p><strong>Good with:</strong> ${pet.goodWith}</p>
                        <p><strong>Description:</strong> ${pet.description}</p>
                    </div>
                `).join('')}
            </div>
            </main>
        `;
    }
    
    const findContent = fs.readFileSync(path.join(__dirname, 'find.html'), 'utf8');
    res.send(Template(findContent + resultsContent));
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send(Template(
        `<main>
        <div class="success">
            <h2>Logged Out Successfully</h2>
            <p>You have been logged out. <a href="/">Return home</a></p>
        </div>
        </main>
    `));
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Create data files if they don't exist
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        fs.mkdirSync(path.join(__dirname, 'data'));
    }
    if (!fs.existsSync(path.join(__dirname, 'data', 'users.txt'))) {
        fs.writeFileSync(path.join(__dirname, 'data', 'users.txt'), '');
    }
    if (!fs.existsSync(path.join(__dirname, 'data', 'pets.txt'))) {
        fs.writeFileSync(path.join(__dirname, 'data', 'pets.txt'), '');
    }
    
});