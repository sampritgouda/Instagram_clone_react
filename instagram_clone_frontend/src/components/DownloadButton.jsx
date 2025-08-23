import { FaDownload } from "react-icons/fa";

const DownloadButton = ({ videourl,id }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(videourl, { mode: "cors" }); // fetch the video
      const blob = await response.blob(); // convert to blob
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `reel-${id}.mp4`; // file name
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url); // cleanup
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="absolute bottom-1 right-5 p-3 rounded-full text-white btn" style={{backgroundColor:"transparent"}}
    >
      <FaDownload size={20} />
    </button>
  );
};

export default DownloadButton;
