const inquirer = require ('inquirer');
const cTable = require('console.table');
const express = require('express');
const db = require('./db/database');
const mysql = require('mysql2');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//app.use('/api', apiRoutes);

app.use((req, res) => {
    res.status(404).end();
});

