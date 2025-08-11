const pc_code_box = document.getElementById('pc_code_box');
const mobile_code_box = document.getElementById('mobile_code_box');
const generatedCode = document.getElementById('generated_code');
const genCode = document.getElementById('gen_code');
const enterCode = document.getElementById('enter-code');
const addCode = document.getElementById('add_code');
const linkButton = document.getElementById('link_button');
const Orientation = document.getElementById('orientation');
const received_data = document.getElementById('received-data-holder');

document.addEventListener('DOMContentLoaded', function () {
    // Function to check if the device is mobile
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    if (isMobileDevice()) {
        if (enterCode) enterCode.style.display = 'block';
        if (addCode) addCode.style.display = 'block';

        [pc_code_box, received_data, generatedCode, genCode, linkButton].forEach(function(el){
            if(el) el.style.display = 'none';
        })

    } else {
        [mobile_code_box, Orientation, enterCode, addCode, linkButton].forEach(function(el){
            if(el) el.style.display = 'none';
        })
        
        if (generatedCode) generatedCode.style.display = 'block';
        if (genCode) genCode.style.display = 'block';

        if (genCode && linkButton) {
            genCode.addEventListener('click', function () {
                this.style.display = 'none';
                linkButton.style.display = 'block';
            });
        }
    }
});