async function handleFormSubmit(event) {

    event.preventDefault();

    if (!validateForm()) {
        console.log("Form validation failed");
        return;
    }

    const formData = new FormData();
    const formElements = event.target.elements;

    formData.append('productName', formElements['productName'].value.trim());
    formData.append('description', formElements['description'].value);
    formData.append('status', formElements['status'].value);
    formData.append('category', formElements['category'].value);
    formData.append('regularPrice', formElements['regularPrice'].value);
    formData.append('salePrice', formElements['salePrice'].value);
    formData.append('quantity', formElements['quantity'].value);


    croppedImagesArray.forEach((image, index) => {
        const blob = dataURItoBlob(image);
        formData.append('productImages', blob, `croppedImage${index}.png`);
    });


    fetch('/admin/addProduct', {
        method: 'POST',
        body: formData
    })
        .then(async response => {
            if (response.ok) {
                const data = await response.json();
                Swal.fire({
                    icon: 'success',
                    title: "Success",
                    text: "product added successfully",
                    timer: 2000
                }).then(() => {
                    window.location.href = "/admin/products";
                });
            } else {
                const err = await response.json();
                throw new Error(err.error);
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: "Oops",
                text: error.message || "An error occurred while adding the product"
            });
        });


}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}



function validateForm() {
    clearErrorMessage();
    const name = document.getElementsByName("productName")[0].value.trim();
    const description = document.getElementById("descriptionId").value.trim();
    const salePrice = document.getElementById('variation-0-salePrice').value.trim();
    const regularPrice = document.getElementById('variation-0-regularPrice').value.trim();
    const quantity = document.getElementById('variation-0-quantity').value.trim();
    const files = document.getElementById('productImages').files;

    let isValid = true;

    if (name == "") {
        displayErrorMessage("name-error", "Please enter a name")
        isValid = false

    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage("name-error", "Product name should contain only aplphabetic characters")
        isValid = false
    }
    if (description == "") {
        displayErrorMessage("description-error", "Please enter a description")
        isValid = false
    }

    if (regularPrice == "") {
        displayErrorMessage("regularPrice-error", "Please enter a Regular Price")
        isValid = false
    }

    if (salePrice == "") {
        displayErrorMessage("salePrice-error", "Please enter a Sale Price")
        isValid = false
    }

    if (quantity == "") {
        displayErrorMessage("quantity-error", "Please enter Product Quantity")
        isValid = false
    }

    if (croppedImagesArray.length < 4) {
        displayErrorMessage("images-error", "Please select at least four images");
        isValid = false;
    }

    return isValid;
}


function displayErrorMessage(elementId, message) {
    var errorElement = document.getElementById(elementId)
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
    } else {
        console.error("Error element not found:", elementId);
    }
}

function clearErrorMessage() {
    var errorElements = document.getElementsByClassName("error-message")
    Array.from(errorElements).forEach((element) => {
        element.innerText = "";
        element.style.display = "none"
    })

}

//image cropping and preview of cropped images

let croppedImagesArray = [];


function previewImages(event) {
    const fileInput = event.target;
    const files = Array.from(fileInput.files);

    files.forEach((file, index) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('image-container');
                imgContainer.style.position = 'relative';
                imgContainer.style.display = 'inline-block';
                imgContainer.style.marginRight = '10px';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('img-thumbnail');
                img.style.maxWidth = '100px';

                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Remove';
                deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '5px';

                deleteBtn.addEventListener('click', () => {
                    croppedImagesArray.splice(index, 1);
                    imgContainer.remove();
                });

                imgContainer.appendChild(img);
                imgContainer.appendChild(deleteBtn);
                document.getElementById('imagePreview').appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        }
    });
}


const upload = document.querySelector("#productImages");
const cropButton = document.querySelector('#btnCrop');
const croppieContainer = document.querySelector('#CroppieContainer');
const imagePreview = document.querySelector('#imagePreview');
var CroppieContainer = document.getElementById("CroppieContainer")
let currentFile = null;

let croppieInstance = new Croppie(document.createElement('div'), {
    viewport: { width: 150, height: 150, type: 'square' },
    boundary: { width: 250, height: 250 },
    enableResize: true
});
croppieContainer.appendChild(croppieInstance.element);


upload.addEventListener('change', function (e) {
    currentFile = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        croppieInstance.bind({
            url: event.target.result
        });
    };
    reader.readAsDataURL(currentFile);

    cropButton.style.display = 'block';
    CroppieContainer.style.display = 'block';
});

cropButton.addEventListener('click', function () {
    croppieInstance.result('canvas').then(function (croppedImage) {
        croppedImagesArray.push(croppedImage);  // Add cropped image to array

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';
        imgContainer.style.marginRight = '10px';

        const img = document.createElement('img');
        img.src = croppedImage;
        img.classList.add('img-thumbnail');
        img.style.maxWidth = '100px';

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Remove';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '5px';
        deleteBtn.style.right = '5px';

        deleteBtn.addEventListener('click', () => {
            const index = croppedImagesArray.indexOf(croppedImage);
            if (index > -1) {
                croppedImagesArray.splice(index, 1);
            }
            imgContainer.remove();
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        imagePreview.appendChild(imgContainer);

        upload.value = '';
        cropButton.style.display = 'none';
        CroppieContainer.style.display = 'none';

    });
});