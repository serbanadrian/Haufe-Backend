import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
const port = 3000;

dotenv.config();

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/notes", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM Participants");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/events", async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        console.error("Missing required fields:", { name, password });
        return res.status(400).send("Missing required fields");
    }

    try {
        const result = await db.query(
            "INSERT INTO Events (name, password) VALUES ($1, $2) RETURNING *",
            [name, password]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error creating event:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/notes", async (req, res) => {
    const { eventId, name, task } = req.body;
    console.log("Received data:", { eventId, name, task });

    if (!eventId || !name || !task) {
        console.error("Missing required fields:", { eventId, name, task });
        return res.status(400).send("Missing required fields");
    }

    try {
        const eventCheck = await db.query("SELECT * FROM Events WHERE id = $1", [eventId]);
        if (eventCheck.rows.length === 0) {
            console.error("Event ID does not exist:", eventId);
            return res.status(404).send("Event ID not found");
        }

        const result = await db.query(
            "INSERT INTO Participants (event_id, name, task) VALUES ($1, $2, $3) RETURNING *",
            [eventId, name, task]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error adding note:", err);
        res.status(500).send('Internal Server Error');
    }
});

app.delete("/notes/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query("DELETE FROM Participants WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length > 0) {
            res.json({ message: "Note deleted successfully." });
        } else {
            res.status(404).send("Note not found.");
        }
    } catch (err) {
        console.error("Error deleting note:", err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
