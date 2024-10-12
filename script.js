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

        const text = new TextDecoder('utf-8').decode(responceArray);
        const {result: { upload_id}} = JSON.parse(text);

        //Get colors and tags from Imagga
        const [colorResult, tagsResult] = await Promise.all([
            fetch(`https://api.imagga.com/v2/colors?image_upload_id=${upload_id}`, {headers: { 'Authorization': authHeader}}).then(res => res.json()),
            fetch(`https://api.imagga.com/v2/tags?image_upload_id=${upload_id}`, {headers: { 'Authorization': authHeader}}).then(res => res.json()),
        ]);

        //Display results
        displayColors(colorResult.result.color);
        displayTags(tagsResult.result.tag);
    }catch(error){
        console.Error('Error', error);
        showToast('An error has occured while processing the image!');
    }finally{
       uploadModal.style.display = 'none'; 
    }
}

document.getElementById('uploadButton').addEventListener('click', upload);

//Function to display color results

const displayColors = colors =>{
    const colorsContainer = document.querySelector('.colors-container');
    colorsContainer.innerHTML = ''; // Clear

    //If now colors are found show an error
    if(![colors.background_colors, colors.foreground_colors, colors.image_colors].some(arr => arr.length)) {
        
        colorsContainer.innerHTML = '<p class="error">Nothing to show</p>';
        return;
    }

    //Genetrate HTML sections for different color types
    const genetrateColorSection = (title, colorData) =>{
        return `

            <h3>${title}</h3>
            <div class="results">
                ${colorData.map(({html_code, closest_palete_color, percent }) => 
                `
                    <div class="result-item" data-color="${html_code}">
                       <div>
                            <div class="color-box" style="background-color:${html_code}" title="Color code: ${html_code}"></div> 
                            <p>${html_code}<span> - ${closest_palete_color}</span></p>
                        </div>
                        <div class="progress-bar">
                            <span>${percent.toFixed(2)}%</span>
                            <div class="progress" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    //Append Section to the container
    colorsContainer.innerHTML += genetrateColorSection('Background Colors', colors.background_colors);
    colorsContainer.innerHTML += genetrateColorSection('Foreground Colors', colors.foreground_colors);
    colorsContainer.innerHTML += genetrateColorSection('Image Colors', colors.image_colors);

    document.querySelectorAll('.colors-container .result-item').forEach(item =>{
        item.addEventListener('click', ()=>{
            const colorCode = item.getAttribute('data-color');
            navigator.clipboard.writeText(colorCode).then(() => showToast(`Copied: ${colorCode}`)).catch(() => showToast('Failed to copy'));
        });
    });

};

//Function to display tags
let allTags = [];
let displayedTags = 0;

function displayTags(tags){
    const tagsContainer = document.querySelector('.tags-container');
    const resultList = tagsContainer.querySelector('.results');
    const error = tagsContainer.querySelector('.error');
    const seeMoreButton = document.querySelector('.seeMoreButton');
    const exportTagsButton = document.querySelector('.exportTagsButton');

    //clear previous tags
    if (resultList) {
        resultList.innerHTML = '';
    }else{
        const resultListContainer = document.createElement('div');
        resultListContainer.className ='results';
        tagsContainer.insertBefore(resultListContainer, seeMoreButton);
    }

    //Store all tags and init display tags count
    allTags = tags;
    displayedTags = 0;

    //Function to show more tags when "See More" button is clicked
    const showMoreTags = () =>{
        const tagsToShow = allTags.slice(displayTags, displayTags + tagsPerPage);
    }

}
