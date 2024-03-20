
// importing the packages to use in our project
import express from "express";
const app = express();
import path from 'path';
const __dirname = path.resolve();
import mysql from 'mysql2';
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
import { createClient } from 'redis';



let client;
async function connectWithRedis(){
    client = createClient({
        password: process.env.REDIS_PASS,
        socket: {
            host: process.env.REDIS_HOST,
            port: 12021,
            legacyMode: true,
        }
    });
    await client.connect();
    console.log("connected with redis");
    // await client.set('mykey', 'Hello from node redis');
    const myKeyValue = await client.get('mykey');
    console.log(myKeyValue);

    await client.expire("data",60); //expire after 10min = 600sec
}

connectWithRedis();
    



//setup some default things for project
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// database connections

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port:3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});
console.log('Connected to MySQL database');



//routes
app.get("/",async(req,res,next)=>{
    // console.log(await client.get("data")); 
    let result = await client.get("data"); //data is in json form
    if(result){
        result = JSON.parse(result);
        console.log("NOW DATA IS COMING FROM REDIS :), It's very fast Woow");
        res.render("./main/show-all-entities.ejs",{result});
    }else{
        next();
    }
}, async (req, res, next) => { //show all entities
    try {
        connection.query("SELECT * FROM entities", async(err, result) => {
            if (err) throw err;

            // console.log(result);
            await client.set("data",JSON.stringify(result)); 
            res.render("./main/show-all-entities.ejs", { result });
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});



app.get("/new-entity", (req, res) => {
    res.render("./main/new-entity.ejs");
})
app.post("/new-entity", async (req, res, next) => {
    let { username, code_language, stdin, source_code } = req.body.data;
    console.log(req.body.data);

    const languageInfo = {
        cpp: {
            "id": 53,
            "name": "C++ (GCC 8.3.0)"
        },
        java: {
            "id": 62,
            "name": "Java (OpenJDK 13.0.1)"
        },
        javascript: {
            "id": 63,
            "name": "JavaScript (Node.js 12.14.0)"
        },
        python: {
            "id": 71,
            "name": "Python (3.8.1)"
        }
    }
    const language_id = languageInfo[code_language].id;
    code_language = languageInfo[code_language].name;
    let user = [uuidv4(), username, language_id, code_language, stdin, source_code];
    console.log(user);


    // get output and language if from judge0 api
    let options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: {
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
            "language_id": `${language_id}`,
            "source_code": btoa(source_code),
            "stdin": btoa(stdin),
        }
    };

    let token;
    try {
        const response = await axios.request(options);
        console.log(response.data);
        token = response.data.token;
        user.push(response.data.token);
    } catch (error) {
        console.error(error.response.data);
    }

    checkStatus(token);
    async function checkStatus(token){
        const options = {
            method: "GET",
            url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            params: {
                base64_encoded: "true",
                fields: "*",
            },
            headers: {
                "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
                "X-RapidAPI-Host": 'judge0-ce.p.rapidapi.com',
            },
        };

        try {
            const response = await axios.request(options);
            const statusId = response.data.status?.id;
            console.log("res", response.data);

            if (statusId === 1 || statusId === 2) {
                //* Id: 1 ---> In queue , Id: 2 ---> Processing

                // Check again after 2 seconds
                setTimeout(() => {
                    checkStatus(token);
                }, 2000);
                
            }else{
                console.log(atob(response.data.stdout));
                if(response.data.stdout){
                    user.push(atob(response.data.stdout));
                }else{
                    user.push("ERROR");
                }
                user.push(response.data.status.description);
                console.log("user",user)
                await saveIntoDB();

                await client.expire("data",0);
                res.redirect("/");
            }
            
        } catch (err) {
            console.log("can't get your requested submission result.")
        }
    }




        function saveIntoDB() {
            try {
                connection.query("INSERT INTO entities (id,username,code_language_id,code_language,stdin,source_code,token,output,code_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", user, (err, result) => {
                    if (err) throw err;

                    console.log(result);
                });
            }
            catch (err) {
                console.log(err);
                next(err);
            }
        }

    });


    // this route i created for me and no one can access it because sometimes i want to delete whole data
    //THIS IS A TEMPORY ROUTE ONLY FOR DEVELOPMENT PHASE NOT FOR PRODUCTION
app.get("/delete-all-data",(req,res,next)=>{
    let{admin} = req.query;
    if(admin == process.env.ADMIN){
        next();
    }else{
        next(new Error("You Can Not Access It, Soory :)"));
    }
},
async(req,res)=>{
    try {
        connection.query("TRUNCATE TABLE entities",(err, result) => {
            if (err) throw err;
            console.log(result);
        });
        await client.expire("data",0);

        res.redirect("/"); //all data deleted of redis in-memory and mysql db also
    }
    catch (err) {
        console.log(err);
        next(err);
    }
})



app.get("/create-table",(req,res,next)=>{
    let{admin} = req.query;
    if(admin == process.env.ADMIN){
        next();
    }else{
        next(new Error("You Can Not Access It, Soory :)"));
    }
},
async(req,res)=>{
    try {
        connection.query("CREATE TABLE entities (id VARCHAR(36) PRIMARY KEY,username VARCHAR(50) NOT NULL,code_language_id INT,code_language VARCHAR(30) NOT NULL,stdin TEXT,source_code TEXT NOT NULL,token VARCHAR(36),output TEXT,code_status TEXT,submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",(err, result) => {
            if (err) throw err;
            console.log(result);
        });
        res.redirect("/"); //all data deleted of redis in-memory and mysql db also
    }
    catch (err) {
        console.log(err);
        next(err);
    }


});
// custom error handling middleware
app.use((err, req, res, next) => {
    res.render("./other/error.ejs",{err})
});
app.all("*",(req,res)=>{
    let err = {
        message:"Page Not Found"
    }
    res.render("./other/error.ejs",{err});
})
// Starting the server on some port
app.listen(3000, () => {
    console.log("server is running on port 3000.");
});
