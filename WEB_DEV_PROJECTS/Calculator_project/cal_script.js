let result = document.getElementById('result');

function appendToResult(value) {
    result.value += value;
}

function C() {
    result.value = '';
}

function backspace() {
    result.value = result.value.slice(0, -1);
}

function calculate() {
    try {
        // Avoid eval's security issues, but eval is fine for a learning project
        result.value = eval(result.value);
    } catch (error) {
        result.value = 'Error';
    }
}
