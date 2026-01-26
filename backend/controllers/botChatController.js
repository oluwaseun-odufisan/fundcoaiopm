import BotChat from '../models/botChatModel.js';
import Task from '../models/taskModel.js';
import axios from 'axios';

export async function sendChatMessage(req, res) {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        // Find or create bot chat for the user
        let chat = await BotChat.findOne({ userId });
        if (!chat) {
            chat = new BotChat({ userId, messages: [] });
        }

        // Save user message
        chat.messages.push({
            text: message,
            sender: 'user',
            timestamp: new Date(),
        });

        // Validate WIT_AI_TOKEN
        if (!process.env.WIT_AI_TOKEN) {
            throw new Error('WIT_AI_TOKEN is not defined in .env');
        }

        // Call Wit.ai API
        const response = await axios.get(
            `https://api.wit.ai/message`,
            {
                params: {
                    q: message,
                    v: '20230603',
                },
                headers: {
                    'Authorization': `Bearer ${process.env.WIT_AI_TOKEN}`,
                    'Accept': 'application/json',
                }
            }
        );

        // Process Wit.ai response
        let botResponse = 'Sorry, I could not process your request.';
        const intents = response.data.intents || [];
        const entities = response.data.entities || {};

        if (intents.length > 0) {
            const intent = intents[0];
            switch (intent.name) {
                case 'greeting':
                    botResponse = 'Hello! How can I help with your tasks today?';
                    break;
                case 'farewell':
                    botResponse = 'Goodbye! Let me know when you need task assistance.';
                    break;
                case 'create_task': {
                    const taskName = entities['task_name:task_name']?.[0]?.value || 'unnamed task';
                    const dueDate = entities['wit$datetime:datetime']?.[0]?.value
                        ? new Date(entities['wit$datetime:datetime'][0].value)
                        : null;
                    await Task.create({
                        userId,
                        title: taskName,
                        dueDate,
                    });
                    botResponse = dueDate
                        ? `Task "${taskName}" created with due date ${new Date(dueDate).toLocaleDateString()}.`
                        : `Task "${taskName}" created.`;
                    break;
                }
                case 'update_task': {
                    const taskName = entities['task_name:task_name']?.[0]?.value;
                    const dueDate = entities['wit$datetime:datetime']?.[0]?.value
                        ? new Date(entities['wit$datetime:datetime'][0].value)
                        : null;
                    const completed = message.toLowerCase().includes('completed') ? true : undefined;
                    if (!taskName) {
                        botResponse = 'Please specify the task to update.';
                        break;
                    }
                    const task = await Task.findOne({ userId, title: taskName });
                    if (!task) {
                        botResponse = `Task "${taskName}" not found.`;
                        break;
                    }
                    if (dueDate) task.dueDate = dueDate;
                    if (completed !== undefined) task.completed = completed;
                    await task.save();
                    botResponse = `Task "${taskName}" updated.`;
                    break;
                }
                case 'delete_task': {
                    const taskName = entities['task_name:task_name']?.[0]?.value;
                    if (!taskName) {
                        botResponse = 'Please specify the task to delete.';
                        break;
                    }
                    const result = await Task.deleteOne({ userId, title: taskName });
                    botResponse = result.deletedCount > 0
                        ? `Task "${taskName}" deleted.`
                        : `Task "${taskName}" not found.`;
                    break;
                }
                case 'list_tasks': {
                    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
                    if (tasks.length === 0) {
                        botResponse = 'You have no tasks.';
                        break;
                    }
                    botResponse = 'Your tasks:\n' + tasks
                        .map((task, index) => `${index + 1}. ${task.title} (${task.completed ? 'Completed' : 'Pending'}${task.dueDate ? `, Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''})`)
                        .join('\n');
                    break;
                }
                case 'task_details': {
                    const taskName = entities['task_name:task_name']?.[0]?.value;
                    if (!taskName) {
                        botResponse = 'Please specify the task for details.';
                        break;
                    }
                    const task = await Task.findOne({ userId, title: taskName });
                    if (!task) {
                        botResponse = `Task "${taskName}" not found.`;
                        break;
                    }
                    botResponse = `Task: ${task.title}\nStatus: ${task.completed ? 'Completed' : 'Pending'}\n` +
                        `${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}\n` : ''}` +
                        `${task.description ? `Description: ${task.description}` : ''}`;
                    break;
                }
                case 'set_reminder': {
                    const taskName = entities['task_name:task_name']?.[0]?.value || 'unnamed task';
                    const dueDate = entities['wit$datetime:datetime']?.[0]?.value
                        ? new Date(entities['wit$datetime:datetime'][0].value)
                        : null;
                    if (!dueDate) {
                        botResponse = 'Please specify a time for the reminder.';
                        break;
                    }
                    await Task.create({
                        userId,
                        title: taskName,
                        dueDate,
                    });
                    botResponse = `Reminder set for "${taskName}" at ${new Date(dueDate).toLocaleString()}.`;
                    break;
                }
                case 'deadline_inquiry': {
                    const taskName = entities['task_name:task_name']?.[0]?.value;
                    if (!taskName) {
                        botResponse = 'Please specify the task for deadline inquiry.';
                        break;
                    }
                    const task = await Task.findOne({ userId, title: taskName });
                    if (!task) {
                        botResponse = `Task "${taskName}" not found.`;
                        break;
                    }
                    botResponse = task.dueDate
                        ? `The deadline for "${taskName}" is ${new Date(task.dueDate).toLocaleDateString()}.`
                        : `No deadline set for "${taskName}".`;
                    break;
                }
                case 'suggest_task': {
                    const tasks = await Task.find({ userId, completed: false })
                        .sort({ dueDate: 1, priority: -1 })
                        .limit(1);
                    botResponse = tasks.length > 0
                        ? `I suggest working on "${tasks[0].title}" next${tasks[0].dueDate ? ` (Due: ${new Date(tasks[0].dueDate).toLocaleDateString()})` : ''}.`
                        : 'You have no pending tasks to work on.';
                    break;
                }
                case 'prioritize_tasks': {
                    const tasks = await Task.find({ userId, completed: false })
                        .sort({ priority: -1, dueDate: 1 })
                        .limit(3);
                    if (tasks.length === 0) {
                        botResponse = 'You have no pending tasks.';
                        break;
                    }
                    botResponse = 'Top priority tasks:\n' + tasks
                        .map((task, i) => `${i + 1}. ${task.title} (Priority: ${task.priority}${task.dueDate ? `, Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''})`)
                        .join('\n');
                    break;
                }
                default:
                    botResponse = `I understood "${intent.name}" but it's not supported yet. Try "list tasks" or "add a task".`;
            }
        } else {
            // Fallback for unrecognized inputs
            botResponse = 'I didn’t understand that. Try commands like "add a task", "list tasks", or "set a reminder".';
        }

        // Save bot response
        chat.messages.push({
            text: botResponse,
            sender: 'bot',
            timestamp: new Date(),
        });

        await chat.save();

        // Return the latest user and bot messages
        const latestMessages = chat.messages.slice(-2);
        res.json({ success: true, messages: latestMessages });
    } catch (err) {
        console.error('Chat error:', err.message, err.response?.data || {});
        let errorMessage = 'Server error';
        if (err.response?.status === 401) {
            errorMessage = 'Invalid Wit.ai token. Please check WIT_AI_TOKEN in .env';
        } else if (err.message.includes('WIT_AI_TOKEN')) {
            errorMessage = err.message;
        }
        res.status(500).json({ success: false, message: errorMessage, error: err.message });
    }
}

export async function getChatHistory(req, res) {
    const userId = req.user._id;

    try {
        const chat = await BotChat.findOne({ userId });
        if (!chat) {
            return res.json({ success: true, messages: [] });
        }
        res.json({ success: true, messages: chat.messages });
    } catch (err) {
        console.error('Chat history error:', err.message);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
}

export async function clearChatHistory(req, res) {
    const userId = req.user._id;

    try {
        await BotChat.deleteOne({ userId });
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
        console.error('Clear chat history error:', err.message);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
}