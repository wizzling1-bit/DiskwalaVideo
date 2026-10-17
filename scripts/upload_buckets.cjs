const fs = require('fs');
const path = require('path');

const accountId = '2377a16d493ea0b8e3ae344fcb089d4f';
const uploadJwt = 'cfwau_eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwaS53b3JrZXJzLmNsb3VkZmxhcmUuY29tIiwiYXVkIjoiaHR0cHM6Ly9hcGkud29ya2Vycy5jbG91ZGZsYXJlLmNvbSIsImV4cCI6MTc5MjI1NjYwNCwibmJmIjoxNzkyMjUzMDA0LCJpYXQiOjE3OTIyNTMwMDQsIm1hbmlmZXN0X2lkIjoiNTZlMzcyOTQtNWFhZS00YmU2LThhMTgtZGQwOTU5OWMyZWJkIiwiYWNjb3VudF9pZCI6OTI0NDUwMjcsInVzZV9zcWwiOnRydWUsImVkZ2Vfa3YiOmZhbHNlLCJidWxrX3VwbG9hZF9mcm9tX3dvcmtlciI6ZmFsc2UsIndyYW5nbGVyX3NpbmdsZV9hc3NldF91cGxvYWRzIjpmYWxzZX0.zWnRAGyJPu61orEU0XlqVY2fKJyuEVj5ksebOSlvt-Pk0QdABqdREgrfW2pOJC3eXPturbKEboaZZ5ufqW_BAg';

const buckets = [
  [
    "9f71044b91292680559bc6b0119bbd4f",
    "56d16785b61285c4c26fd73146e4a10d",
    "b89a8bbedd2fc9f54527d6681f8ee17b",
    "6e49f636e0a40023461117cda1393e5c",
    "67ca3b04553d13b50336c7c08f0be852",
    "58c89e1e7be3d6e161df5928754c8359",
    "865cd1d68aa8e78c047313ae800c8764",
    "142554b9d8e5f0cd0040bfe805bafa4c",
    "724577510b3d37580ca13d40aa068388",
    "0294f59ef27bc1a972478fff0770f086",
    "ecfe8bc2bc3cdac5ad0afda256b1ff0a",
    "7d1d229a0c0cd91ba899156b4738d3b1",
    "7fe3c41cb2ec2982470a6fe29e973d7f",
    "791971eda2f6558451c05b9c76ca2485",
    "124dddbdc43bbc96e80e704bea82f1a4",
    "0dabb66855d620525f6ad98cab1fdf72",
    "aec3cbe1677f622a9ba89cd294faf706",
    "e062450db4dcdb63d748292101a69cf1"
  ],
  [
    "bce0736f3a4bd5c30d7a7b21c81dc7df",
    "3b6fc3338b0dcabe21b203b2681a7166",
    "5115d54c306aa77bbf9aa38fd0fad14e",
    "b2d4724099300507a995c79de9c546ef",
    "18392bb47761ef54da65a614258f79d7",
    "b352d9155150b0bd43dba12511dda414",
    "4caf8d1263fe3a10647d84e3c74056a8",
    "44452d9f788e024056fdaeb1309bff9d",
    "f53addc8f3f179d6270957fdd0c60232",
    "a92ea525f3bb97037d9236464eabf682",
    "b3629747b2a064b1d47dc969140c4efb",
    "1887131769b904cfaabfa685205537c8",
    "f9c155b68a4b93d486de79414a82e418",
    "fbc05e88b510496869018d8732c9bbba",
    "444b38e215c69bd75eeabd150d7540cb",
    "e61b3dfeda27af02a0b48fb857a633ae",
    "5ae8fba9df42494ad8b22d865332dbeb"
  ],
  [
    "c94c2a4b5f9bf6c1511c4d82b9c44125",
    "eb0828f9582793ce0d33fa3f6e13a7a1",
    "76fb7f5d1a7356aa6ddcea236f695a99",
    "5fe01d67ef08ff705e18c82830ba0848",
    "f697ab57a7d5dc7c9e6a4b7173a2d83b",
    "61c99594ec0a70f339fb875fe7a407b6",
    "10fec6d34c7785a45c35b679676d8f7f",
    "45db81cb961985db54e52cd6921f33e7",
    "a38a392c9d181f7e11d79a8f96f4cfe3",
    "91e94e148d8bcbd07ce76956307414f6",
    "e8a13ccb5a289d857005587aa7ff95ec",
    "f1ffd9270cde96c3d0a4f199e89d54ad",
    "ce926de2b3bdf9bd06a19bc112f09fb1",
    "9cc6b69cb5af6061dad559c50b500475",
    "bf4c491b7c663eaf497255bb514e00c7",
    "07f815f07309947d4efc02d9d4921ebd",
    "9e2b475419f7d82c4b414370eef1f9d6"
  ]
];

const hashMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scratch/hash_map.json'), 'utf8'));

async function uploadAll() {
  let completionJwt = null;

  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    console.log(`Uploading bucket ${i + 1}/${buckets.length} (${bucket.length} files)...`);

    const boundary = '----CFAssetsBoundary' + Date.now() + Math.random().toString(36).substring(2);
    const chunks = [];

    for (const h of bucket) {
      const fileInfo = hashMap[h];
      if (!fileInfo) {
        console.warn(`File info for hash ${h} not found!`);
        continue;
      }

      const content = fs.readFileSync(fileInfo.fullPath);
      const b64 = content.toString('base64');

      chunks.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${h}"\r\n` +
        `Content-Type: ${fileInfo.mime}\r\n\r\n` +
        b64 + `\r\n`
      ));
    }

    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(chunks);

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/assets/upload?base64=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadJwt}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fullBody
    });

    const data = await res.json();
    console.log(`Bucket ${i + 1} status: ${res.status}, success: ${data.success}`);

    if (data.result && data.result.jwt) {
      completionJwt = data.result.jwt;
      console.log('Got completion JWT!');
    }
  }

  if (completionJwt) {
    fs.writeFileSync(path.resolve(__dirname, '../scratch/completion_jwt.txt'), completionJwt);
    console.log('Saved completion JWT to scratch/completion_jwt.txt');
  } else {
    console.error('Did not receive completion JWT.');
  }
}

uploadAll().catch(console.error);
