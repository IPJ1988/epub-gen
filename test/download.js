import axios from "axios";

const download = async () => {
  const response = await axios.get(
    "https://s3.ap-southeast-1.amazonaws.com/prod.hti.content.public/epub-template/fonts/Sarabun-Regular.ttf"
  );
  console.log(response.data);
};
download();
