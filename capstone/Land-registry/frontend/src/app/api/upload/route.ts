import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fullName = formData.get("fullName") as string;
    const location = formData.get("location") as string;
    const size = formData.get("size") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt || pinataJwt === "YOUR_PINATA_JWT_HERE") {
      console.error("PINATA_JWT is not set in environment variables");
      return NextResponse.json({ error: "IPFS configuration error on server" }, { status: 500 });
    }

    // 1. Upload the file to Pinata IPFS
    const fileData = new FormData();
    fileData.append("file", file);

    const fileRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: fileData,
    });

    if (!fileRes.ok) {
      const errorText = await fileRes.text();
      console.error("Pinata file upload error:", errorText);
      return NextResponse.json({ error: "Failed to upload file to IPFS" }, { status: 500 });
    }

    const fileJson = await fileRes.json();
    const imageIpfsUri = `ipfs://${fileJson.IpfsHash}`;

    // 2. Upload metadata JSON to Pinata IPFS
    const metadata = {
      name: `Land Parcel Document: ${location}`,
      description: `Official document/photo for land parcel at ${location} (Size: ${size} sqm)`,
      image: imageIpfsUri,
      attributes: [
        { trait_type: "Owner Name", value: fullName || "Unknown" },
        { trait_type: "Location", value: location },
        { trait_type: "Size (sqm)", value: size },
      ],
    };

    const metadataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `Land_Metadata_${Date.now()}.json`,
        },
      }),
    });

    if (!metadataRes.ok) {
      const errorText = await metadataRes.text();
      console.error("Pinata metadata upload error:", errorText);
      return NextResponse.json({ error: "Failed to upload metadata to IPFS" }, { status: 500 });
    }

    const metadataJson = await metadataRes.json();
    const metadataIpfsUri = `ipfs://${metadataJson.IpfsHash}`;

    return NextResponse.json({ metadataURI: metadataIpfsUri });
  } catch (error: any) {
    console.error("Error in /api/upload:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
