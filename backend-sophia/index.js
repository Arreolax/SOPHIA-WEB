const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Crear un usuario de prueba
app.post('/api/users', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: { 
        email: 'empleado@empresa.com', 
        name: 'Juan Pérez' 
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Crear un ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, authorId } = req.body;
    const ticket = await prisma.ticket.create({
      data: { title, description, authorId }
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Error al crear ticket" });
  }
});

// Ver todos los tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { author: true }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tickets" });
  }
});

app.listen(3000, () => {
  console.log('Backend corriendo en http://localhost:3000');
});