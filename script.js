// Set number of tags per page
const tagsPerPage = 20;

// Event listener for upload
document.getElementById('uploadButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const uploadModal = document.getElementById('uploadModal');
    const uploadProgress = document.getElementById('uploadProgress');

    // If no file is selected, show an error
    if (!file) {
        return showToast('Please select an image file');
    }

    // Preview the selected image
    const reader = new FileReader();
    reader.onload = e => imagePreview.src = e.target.result;
    reader.readAsDataURL(file);

    // API credentials from Imagga 
    const apiKey = 'acc_5ac30301bd8ac81';
    const apiSecret = 'fb006dc6a7109dcd040a727659cb5d75';
    const authHeader = 'Basic ' + btoa(`${apiKey}:${apiSecret}`);

    // Prepare data for upload
    const formData = new FormData();
    formData.append('image', file);

    try {
        // Show upload modal and reset progress bar
        uploadModal.style.display = 'block';
        uploadProgress.style.width = '0%';

        // Upload image to Imagga
        const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
            method: 'POST',
            headers: { 'Authorization': authHeader },
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }

        // Decode and parse upload response
        const uploadData = await uploadResponse.json();
        const uploadId = uploadData.result.upload_id;

        // Get colors and tags from Imagga
        const [colorResult, tagsResult] = await Promise.all([
            fetch(`https://api.imagga.com/v2/colors?image_upload_id=${uploadId}`, { headers: { 'Authorization': authHeader } }).then(res => res.json()),
            fetch(`https://api.imagga.com/v2/tags?image_upload_id=${uploadId}`, { headers: { 'Authorization': authHeader } }).then(res => res.json()),
        ]);

        // Display results
        displayColors(colorResult.result.colors);
        displayTags(tagsResult.result.tags);

    } catch (error) {
        console.error('Error', error);
        showToast('An error has occurred while processing the image!');
    } finally {
        uploadModal.style.display = 'none';
    }
});

// Function to display color results
const displayColors = (colors) => {
    const colorsContainer = document.querySelector('.colors-container');
    colorsContainer.innerHTML = ''; // Clear

    // If no colors are found, show an error
    if (!colors || (!colors.background_colors.length && !colors.foreground_colors.length && !colors.image_colors.length)) {
        colorsContainer.innerHTML = '<p class="error">Nothing to show</p>';
        return;
    }

    // Generate HTML sections for different color types
    const generateColorSection = (title, colorData) => `
        <h3>${title}</h3>
        <div class="results">
            ${colorData.map(({ html_code, closest_palette_color, percent }) => `
                <div class="result-item" data-color="${html_code}">
                    <div>
                        <div class="color-box" style="background-color:${html_code}" title="Color code: ${html_code}"></div>
                        <p>${html_code}<span> - ${closest_palette_color}</span></p>
                    </div>
                    <div class="progress-bar">
                        <span>${percent.toFixed(2)}%</span>
                        <div class="progress" style="width: ${percent}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Append sections to the container
    colorsContainer.innerHTML += generateColorSection('Background Colors', colors.background_colors);
    colorsContainer.innerHTML += generateColorSection('Foreground Colors', colors.foreground_colors);
    colorsContainer.innerHTML += generateColorSection('Image Colors', colors.image_colors);

    document.querySelectorAll('.colors-container .result-item').forEach(item => {
        item.addEventListener('click', () => {
            const colorCode = item.getAttribute('data-color');
            navigator.clipboard.writeText(colorCode)
                .then(() => showToast(`Copied: ${colorCode}`))
                .catch(() => showToast('Failed to copy'));
        });
    });
};

//Function to display tags
let allTags = [];
let displayedTags = 0;

const displayTags = tags =>{
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
        const tagsToShow = allTags.slice(displayedTags, displayedTags + tagsPerPage);
        displayedTags += tagsToShow.length;
        const tagsHTML = tagsToShow.map(({tag: {en} }) => `
            <div class="result-item">
                <p>${en}</p>
            </div>
        `).join(''); 
        
        if(resultList){
            resultList.innerHTML = tagsHTML;
        }

        //Toggle visibilty of error and buttons
        error.style.display = displayedTags > 0 ? 'none' : 'block';
        error.style.display = displayedTags < allTags.length ? 'block' : 'none';
        exportTagsButton.style.display = displayedTags > 0 ? 'block' : 'none';
    };

    showMoreTags(); //init load of tags

    //Event for see more and export buttons
    seeMoreButton.addEventListener('click', showMoreTags);
    exportTagsButton.addEventListener('click', exportTagsToFile);
};

//Function to export tags to file
function exportTagsToFile(){
    if(allTags.length === 0){
        showBurn('No tags availible to export!');
        return;
    }

    //convert tags to download
    const tagsText = allTags.map( ( { tag:{ en } } ) => en).join('\n');
    const blob = new Blob([tagsText], { type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tags.txt';
    a.click();
    URL.revokeObjectURL(url);
};

//Function showBurn message

const showToast = message =>{
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
    });
    setTimeout(() => document.body.removeChild(toast), 500);
};
