// Initialize variables
let web3;
let account;
let contract;

// Contract ABI and Address (replace with your actual values)
const abi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "author",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "NewPost",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "postId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newUpvoteCount",
        "type": "uint256"
      }
    ],
    "name": "UpvotedPost",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasUpvoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "posts",
    "outputs": [
      {
        "internalType": "address",
        "name": "author",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "upvotes",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_content",
        "type": "string"
      }
    ],
    "name": "postStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPosts",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "author",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "content",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "upvotes",
            "type": "uint256"
          }
        ],
        "internalType": "struct SimpleTwitter.Post[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "postId",
        "type": "uint256"
      }
    ],
    "name": "upvotePost",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const rawContractAddress = '0xca72927fB16EDc5a5ee1AE4224974F5dd7DA9daC';

// Function to check if MetaMask is connected
function checkMetaMaskConnection() {
  if (window.ethereum) {
      if (!web3) {
          web3 = new Web3(window.ethereum);
      }
      const contractAddress = web3.utils.toChecksumAddress(rawContractAddress);
      if (!contract) {
          contract = new web3.eth.Contract(abi, contractAddress);
      }
      window.ethereum.request({ method: 'eth_accounts' })
          .then(async accounts => {
              if (accounts.length > 0) {
                  // MetaMask is connected
                  account = accounts[0];
                  document.getElementById('connectWallet').style.display = 'none';
                  displayBlockie(account);

                  // Now fetch and display posts
                  await fetchAndDisplayPosts();

                  // Subscribe to UpvotedPost event here
                  contract.events.UpvotedPost()
                      .on("data", (event) => {
                          const { postId, newUpvoteCount } = event.returnValues;
                          const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                          const upvoteButton = postElement.querySelector(".upvote-btn");
                          upvoteButton.innerText = `Upvote (${newUpvoteCount})`;
                      })
                      .on("error", (error) => {
                          console.error("Error in UpvotedPost event listener:", error);
                      });
              }
          })
          .catch((error) => {
              console.error(error);
          });
  }
}

function displayBlockie(address) {
  try {
      console.log("Trying to display blockie for address:", address);

      if (!web3 || !web3.utils) {
          console.error("Web3 is not initialized properly.");
          return;
      }

      const formattedAddress = web3.utils.toChecksumAddress(address);
      console.log("Formatted address:", formattedAddress);

      const blockieCanvas = blockies.create({ seed: formattedAddress, size: 8, scale: 5 });
      if (!blockieCanvas) {
          console.error("Failed to create blockie canvas.");
          return;
      }

      const blockieImg = document.createElement("img");
      blockieImg.src = blockieCanvas.toDataURL("image/png");
      console.log("Generated blockie Data URL:", blockieImg.src);

      // Add the blockie image to your UI
      const profilePictureDiv = document.querySelector('.profile-picture');
      if (!profilePictureDiv) {
          console.error("Failed to find '.profile-picture' element in the document.");
          return;
      }

      // Clear any existing children (previous blockies)
      while (profilePictureDiv.firstChild) {
          profilePictureDiv.removeChild(profilePictureDiv.firstChild);
      }

      profilePictureDiv.appendChild(blockieImg);
      console.log(document.querySelector('.profile-picture').innerHTML);
  } catch (error) {
      console.error("Error in displayBlockie:", error);
  }
}




// Connect to MetaMask
document.getElementById('connectWallet').onclick = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            account = accounts[0];
            web3 = new Web3(window.ethereum);
            contract = new web3.eth.Contract(abi, rawContractAddress);
            
            // Hide the button after successful connection
            document.getElementById('connectWallet').style.display = 'none';
            await fetchAndDisplayPosts();

        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        console.log("Ethereum object doesn't exist!");
    }
};

// Post a status
document.getElementById('postStatus').onclick = async () => {
    const statusContent = document.getElementById('status').value;
    if (statusContent) {
        try {
            const txReceipt = await contract.methods.postStatus(statusContent).send({ from: account });
            console.log("Status posted with transaction hash:", txReceipt.transactionHash);
            fetchAndDisplayPosts();  // Refresh posts after posting
        } catch (error) {
            console.error("Error posting status:", error);
        }
    } else {
        alert("Please enter a status before posting.");
    }
};

// Fetch and display all posts
async function fetchAndDisplayPosts() {
  try {
      console.log("Fetching posts...");
      const postsArray = await contract.methods.getPosts().call();
      console.log("Retrieved posts:", postsArray);
      
      const postsDiv = document.getElementById('posts');
      postsDiv.innerHTML = '';  // Clear current posts

      if (postsArray.length === 0) {
          console.log("No posts found.");
          postsDiv.innerHTML = '<p>No posts available.</p>';
          return;
      }

      postsArray.forEach((post, index) => {
          const postElement = document.createElement('div');
          postElement.className = 'card mb-3 post-card';
        
          // Generate blockie for the post's author
          const blockieCanvas = blockies.create({ seed: post.author, size: 8, scale: 5 });
          const blockieImgURL = blockieCanvas.toDataURL("image/png");

          postElement.innerHTML = `
              <div class="card-body">
                  <div class="post-header">
                      <img src="${blockieImgURL}" alt="Author Blockie" class="post-blockie">
                      <h5 class="card-title">${post.author}</h5>
                  </div>
                  <p class="card-text">${post.content}</p>
                  <p class="card-text"><small class="text-muted">${new Date(post.timestamp * 1000).toLocaleString()}</small></p>
                  <button class="btn btn-sm btn-primary upvote-btn" data-post-id="${index}">Upvote (${post.upvotes})</button>
              </div>
          `;
          postsDiv.appendChild(postElement);

          const upvoteButton = postElement.querySelector(".upvote-btn");
          upvoteButton.addEventListener("click", () => {
              upvotePost(index);
          });
      });
  } catch (error) {
      console.error("Error fetching posts:", error);
  }
}


async function upvotePost(postId) {
  try {
      await contract.methods.upvotePost(postId).send({ from: account });
      // Refresh posts after upvoting
      fetchAndDisplayPosts();
  } catch (error) {
      console.error("Error upvoting post:", error);
  }
}

// Check MetaMask connection and fetch posts on page load
window.onload = function() {
    checkMetaMaskConnection();
};

document.addEventListener('DOMContentLoaded', (event) => {
  // Check MetaMask connection and fetch posts as soon as the DOM is loaded
  checkMetaMaskConnection();
});
