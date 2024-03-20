"use strict";
const connection = new signalR.HubConnectionBuilder()
    .configureLogging(signalR.LogLevel.Debug)
    .withUrl("http://localhost:5173/chathub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .build();
const start = async () => {
    try {
        await connection.start();
    }
    catch (error) {
        console.log(error);
    }
};
const joinUser = async () => {
    const name = window.prompt('Enter your name');
    if (name) {
        sessionStorage.setItem('user', name);
        await joinChat(name);
    }
};
const joinChat = async (user) => {
    if (!user)
        return;
    try {
        const message = `${user} Joined`;
        await connection.invoke("JoinChat", user, message);
    }
    catch (error) {
        console.log(error);
    }
};
const getUser = () => sessionStorage.getItem('user');
const receiveMessage = async () => {
    const currentUser = getUser();
    if (!currentUser) return;
    try {
        connection.on("ReceivedMessage", (user, message) => {
            const messageClass = currentUser === user ? "send" : "received";
            appendMessage(message, messageClass);
        });
        connection.on("ReceivedFile", (user, fileName, fileData) => {
            const messageClass = currentUser === user ? "send" : "received";
            if (fileData.startsWith("data:image")) {
                appendImage(fileData, messageClass);
            } else {
                appendFile(user, fileName, fileData, messageClass);
            }
        });
    }
    catch (error) { console.log(error); }
};
const appendMessage = (message, messageClass) => {
    const messageSectionEL = document.getElementById('messageSection');
    const msgBoxEL = document.createElement("div");
    msgBoxEL.classList.add("msg-box");
    msgBoxEL.classList.add(messageClass);
    msgBoxEL.textContent = message;
    messageSectionEL.appendChild(msgBoxEL);
};
const appendFile = (user, fileName, fileData, messageClass) => {
    const messageSectionEL = document.getElementById('messageSection');
    const msgBoxEL = document.createElement("div");
    msgBoxEL.classList.add("msg-box");
    msgBoxEL.classList.add(messageClass);
    const linkEL = document.createElement("a");
    linkEL.href = `data:application/octet-stream;base64,${fileData}`;
    linkEL.download = fileName;
    linkEL.textContent = fileName;
    msgBoxEL.appendChild(linkEL);

    const filePreview = document.createElement("div");
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
        const imageEL = document.createElement("img");
        imageEL.src = `data:image/jpeg;base64,${fileData}`;
        imageEL.classList.add("file-preview");
        filePreview.appendChild(imageEL);
    } else {
        const fileText = document.createElement("p");
        fileText.textContent = `File type not supported to Preview.`;
        filePreview.appendChild(fileText);
    }
    msgBoxEL.appendChild(filePreview);
    messageSectionEL.appendChild(msgBoxEL);
};
const appendImage = (imageData, messageClass) => {
    const messageSectionEL = document.getElementById('messageSection');
    const msgBoxEL = document.createElement("div");
    msgBoxEL.classList.add("msg-box");
    //msgBoxEL.classList.add(messageClass);
    const imageEL = document.createElement("img");
    imageEL.src = imageData;
    imageEL.classList.add("file-preview");
    msgBoxEL.appendChild(imageEL);
    messageSectionEL.appendChild(msgBoxEL);
};
const sendFile = async (user, file) => {
    try {
        const formData = new FormData();
        formData.append('user', user);
        formData.append('file', file);
        await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
    } catch (error) {
        console.log(error);
    }
};
const sendMessage = async (user, message) => {
    try {
        await connection.invoke('SendMessage', user, message)
    }
    catch (error) {
        console.log(error);
    }
}
document.getElementById('btnSendFile').addEventListener('click', async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        await sendFile(user, file);
        fileInput.value = null;
    }
});
document.getElementById('btnSend').addEventListener('click', async (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user)
        return;
    const txtmessageEL = document.getElementById('txtMessage');
    const msg = txtmessageEL.value;
    if (msg) {
        await sendMessage(user, `${user}: ${msg}`)
        txtmessageEL.value = "";
    }
});
const startApp = async () => {
    await start();
    await joinUser();
    await receiveMessage();
};
startApp();