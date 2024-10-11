// ste number of tegs per page
const tagsPerPage = 20;

//event listener fo upload

 async function upload() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const uploadModal = document.getElementById('uploadModal');
    const uploadProgress = document.getElementById('uploadProgress');

    // if now message is selected show error
    
    if (!file) {
        return showToast('Please select an image file');
    };

    //Preview the selected image

    const reader = new FileReader();
    reader.onload = e => imagePreview.src = e.target.result;
    reader.readAsDataURL(file);

    //API credentials from Imagga 
    const apiKey = 'acc_5ac30301bd8ac81';
    const apiSecret = 'fb006dc6a7109dcd040a727659cb5d75';
    const authHeader = 'Basic '+ btoa(`${apiKey}:${apiSecret}`);

    //Prepare data for upload
    const formData = new FormData();
    formData.append('image', file);

    try{
        //Show upload modal and reset progress bar
        uploadModal.style.display = 'block';
        uploadProgress.style.width = '0%';

        //Upload image to Imagga
        const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
            method: 'POST',
            headers: {'Authorization': authHeader},
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload failed')
        }

        //Track progress
        const contentLength =+ uploadResponse.headers.get('Content-Length');
        const reader = uploadResponse.body.getReader();
        let receivedLength = 0;
        let chuncks = [];

        //Read responce stream and update progress
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chuncks.push(value);
            receivedLength += value.length;
            uploadProgress.style.width = `${(receivedLength/contentLength)*100}%`
        }

        //decode and parse upload responce
        const responceArray = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunck of chuncks) {
            responceArray.set(chunck, position);
            position += chunck.length;
        }



    }
}

document.getElementById('uploadButton').addEventListener('click', upload);