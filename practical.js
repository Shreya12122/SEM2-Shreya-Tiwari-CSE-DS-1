function startCountdown() {
    let num = document.getElementById("numberInput").value;
    let display = document.getElementById("display");

    if (num === "" || num <= 0) {
        display.innerHTML = "Enter a  number!";
        return;
    }

    let count = parseInt(num);

    let interval = setInterval(function () {
        display.innerHTML = count;

        count--;

        if (count < 0) {
            clearInterval(interval);
            display.innerHTML = "Countdown Finished!";
        }
    }, 1000);
}