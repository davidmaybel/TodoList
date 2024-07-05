const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/todoapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const taskSchema = new mongoose.Schema({
    name: String,
    category: String,
    done: { type: Boolean, default: false }
});

const categorySchema = new mongoose.Schema({
    name: String,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

const Task = mongoose.model('Task', taskSchema);
const Category = mongoose.model('Category', categorySchema);

app.post('/tasks', async (req, res) => {
    const { name, categoryName } = req.body;
    const task = new Task({ name, category: categoryName });
    await task.save();

    if (categoryName) {
        const category = await Category.findOne({ name: categoryName });
        if (category) {
            category.tasks.push(task._id);
            await category.save();
        } else {
            return res.status(400).send('Category does not exist.');
        }
    }

    res.status(201).send(task);
});

app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { name, categoryName } = req.body;
    const task = await Task.findById(id);

    if (task) {
        if (name) task.name = name;
        if (categoryName) {
            task.category = categoryName;
            const category = await Category.findOne({ name: categoryName });
            if (category) {
                category.tasks.push(task._id);
                await category.save();
            } else {
                return res.status(400).send('Category does not exist.');
            }
        }
        await task.save();
        res.send(task);
    } else {
        res.status(404).send('Task not found.');
    }
});

app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (task) {
        if (task.category) {
            const category = await Category.findOne({ name: task.category });
            if (category) {
                category.tasks = category.tasks.filter(taskId => !taskId.equals(task._id));
                await category.save();
            }
        }
        res.send(task);
    } else {
        res.status(404).send('Task not found.');
    }
});

app.get('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (task) {
        res.send(task);
    } else {
        res.status(404).send('Task not found.');
    }
});

app.post('/categories', async (req, res) => {
    const { name } = req.body;
    const existingCategory = await Category.findOne({ name });
    if (!existingCategory) {
        const category = new Category({ name });
        await category.save();
        res.status(201).send(category);
    } else {
        res.status(400).send('Category already exists.');
    }
});

app.put('/categories/:name', async (req, res) => {
    const { name } = req.params;
    const { newName } = req.body;
    const category = await Category.findOne({ name });
    if (category) {
        category.name = newName;
        await category.save();
        res.send(category);
    } else {
        res.status(404).send('Category not found.');
    }
});

app.delete('/categories/:name', async (req, res) => {
    const { name } = req.params;
    const category = await Category.findOneAndDelete({ name });
    if (category) {
        res.send(category);
    } else {
        res.status(404).send('Category not found.');
    }
});

app.get('/categories/:name', async (req, res) => {
    const { name } = req.params;
    const category = await Category.findOne({ name }).populate('tasks');
    if (category) {
        res.send(category);
    } else {
        res.status(404).send('Category not found.');
    }
});

app.put('/tasks/:id/mark_done', async (req, res) => {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (task) {
        task.done = true;
        await task.save();
        res.send(task);
    } else {
        res.status(404).send('Task not found.');
    }
});

app.get('/tasks/count', async (req, res) => {
    const count = await Task.countDocuments();
    res.send({ count });
});

app.get('/categories/count', async (req, res) => {
    const count = await Category.countDocuments();
    res.send({ count });
});

app.get('/categories/:name/tasks/count', async (req, res) => {
    const { name } = req.params;
    const category = await Category.findOne({ name });
    if (category) {
        res.send({ count: category.tasks.length });
    } else {
        res.status(404).send('Category not found.');
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});