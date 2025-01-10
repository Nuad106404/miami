import express from 'express';
import Villa from '../../models/Villa.js';
import upload from '../../../config/multer.mjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Create uploads directory for villa backgrounds if it doesn't exist
const villaUploadsDir = path.join(__dirname, '../../../server/uploads/villa');
if (!fs.existsSync(villaUploadsDir)) {
  fs.mkdirSync(villaUploadsDir, { recursive: true });
}

// Create uploads directory for QR codes if it doesn't exist
const qrUploadsDir = path.join(__dirname, '../../../server/uploads/QR');
if (!fs.existsSync(qrUploadsDir)) {
  fs.mkdirSync(qrUploadsDir, { recursive: true });
}

// Create uploads directory for room images if it doesn't exist
const roomUploadsDir = path.join(__dirname, '../../../server/uploads/rooms');
if (!fs.existsSync(roomUploadsDir)) {
  fs.mkdirSync(roomUploadsDir, { recursive: true });
}

// Get villa details
router.get('/', async (req, res) => {
  try {
    let villa = await Villa.findOne();
    if (!villa) {
      villa = await Villa.create({
        name: {
          en: 'Villa Paradise',
          th: 'วิลล่า พาราไดซ์'
        },
        title: {
          en: 'Experience Luxury Like Never Before',
          th: 'สัมผัสประสบการณ์ความหรูหราที่ไม่เคยมีมาก่อน'
        },
        description: {
          en: 'A luxurious villa with modern amenities',
          th: 'วิลล่าหรูพร้อมสิ่งอำนวยความสะดวกทันสมัย'
        },
        beachfront: {
          en: 'Direct access to the beach',
          th: 'เข้าถึงชายหาดได้โดยตรง'
        },
        pricePerNight: 299,
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 3
      });
    }
    res.json(villa);
  } catch (error) {
    console.error('Error getting villa details:', error);
    res.status(500).json({ message: 'Error getting villa details' });
  }
});

// Update bank details
router.patch('/bank-details', async (req, res) => {
  try {
    const { bankDetails } = req.body;

    // Validate bank details
    if (!Array.isArray(bankDetails)) {
      return res.status(400).json({
        message: 'Bank details must be an array'
      });
    }

    // Validate each bank detail
    for (const bank of bankDetails) {
      if (!bank.bank || !bank.accountNumber || !bank.accountName) {
        return res.status(400).json({
          message: 'Each bank detail must include bank name, account number, and account name'
        });
      }
    }

    // Find the villa
    let villa = await Villa.findOne();
    if (!villa) {
      villa = new Villa();
    }

    // Format and update bank details
    const formattedBankDetails = bankDetails.map(bank => ({
      bank: bank.bank.trim(),
      accountNumber: bank.accountNumber.trim().replace(/\s+/g, '-'),
      accountName: bank.accountName.trim()
    }));

    villa.bankDetails = formattedBankDetails;
    await villa.save();

    res.json({
      message: 'Bank details updated successfully',
      bankDetails: villa.bankDetails
    });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ 
      message: 'Error updating bank details',
      error: error.message 
    });
  }
});

// Update villa details
router.patch('/', async (req, res) => {
  try {
    const { 
      name, 
      title, 
      description, 
      beachfront, 
      maxGuests, 
      bedrooms, 
      minRooms,
      bathrooms, 
      pricePerNight, 
      discountedPrice,
      priceReductionPerRoom,
      bankDetails,
      promptPay
    } = req.body;

    // Find the villa
    let villa = await Villa.findOne();
    if (!villa) {
      villa = new Villa();
    }

    // Update fields if provided
    if (name?.en && name?.th && title?.en && title?.th && description?.en && description?.th) {
      villa.name = name;
      villa.title = title;
      villa.description = description;
    }

    // Update optional beachfront if provided
    if (beachfront) {
      villa.beachfront = {
        en: beachfront.en || villa.beachfront.en,
        th: beachfront.th || villa.beachfront.th
      };
    }

    // Update pricePerNight if provided
    if (pricePerNight !== undefined) {
      villa.pricePerNight = pricePerNight;
    }

    // Update discountedPrice if provided
    if (discountedPrice !== undefined) {
      // Validate that discounted price is less than regular price
      if (discountedPrice > 0 && discountedPrice >= pricePerNight) {
        return res.status(400).json({
          message: 'Discounted price must be less than regular price'
        });
      }
      villa.discountedPrice = discountedPrice;
    }

    // Update minRooms if provided
    if (minRooms !== undefined) {
      // Validate that minRooms is not greater than bedrooms
      if (minRooms > bedrooms) {
        return res.status(400).json({
          message: 'Minimum rooms cannot be greater than total bedrooms'
        });
      }
      villa.minRooms = minRooms;
    }

    // Update bedrooms if provided
    if (bedrooms !== undefined) {
      villa.bedrooms = bedrooms;
    }

    // Update bathrooms if provided
    if (bathrooms !== undefined) {
      villa.bathrooms = bathrooms;
    }

    // Update priceReductionPerRoom if provided
    if (priceReductionPerRoom !== undefined) {
      villa.priceReductionPerRoom = priceReductionPerRoom;
    }

    // Update maxGuests if provided
    if (maxGuests !== undefined) {
      villa.maxGuests = maxGuests;
    }

    // Update bankDetails if provided
    if (bankDetails !== undefined) {
      villa.bankDetails = bankDetails;
    }

    // Update promptPay if provided
    if (promptPay !== undefined) {
      villa.promptPay = promptPay;
    }

    await villa.save();
    res.json(villa);
  } catch (error) {
    console.error('Error updating villa details:', error);
    res.status(500).json({ 
      message: 'Error updating villa details',
      error: error.message 
    });
  }
});

router.patch('/background', upload.villa.single('backgroundImage'), async (req, res) => {
  try {
    console.log('Received file upload request');
    console.log('File:', req.file);

    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const villa = await Villa.findOne();
    if (!villa) {
      console.log('Villa not found');
      return res.status(404).json({ message: 'Villa not found' });
    }

    // Delete old background image if it exists
    if (villa.backgroundImage) {
      const oldImagePath = path.join(__dirname, '../../../server/uploads/villa', path.basename(villa.backgroundImage));
      console.log('Checking old image at:', oldImagePath);
      if (fs.existsSync(oldImagePath)) {
        console.log('Deleting old image');
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update villa with new background image path
    villa.backgroundImage = `${process.env.CLIENT_URL}/uploads/villa/${req.file.filename}`;
    console.log('Setting new image URL:', villa.backgroundImage);
    await villa.save();

    console.log('Villa updated successfully');
    res.json({ message: 'Background image updated successfully', backgroundImage: villa.backgroundImage });
  } catch (error) {
    console.error('Error updating background image:', error);
    res.status(500).json({ message: 'Error updating background image', error: error.message });
  }
});


// Handle slide images upload
router.post('/slides', upload.villa.array('slideImages', 10), async (req, res) => {
  try {
    console.log('Received slide images upload request');
    console.log('Files:', req.files);

    if (!req.files || req.files.length === 0) {
      console.log('No files received');
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const villa = await Villa.findOne();
    if (!villa) {
      console.log('Villa not found');
      return res.status(404).json({ message: 'Villa not found' });
    }

    // Delete old slide images if they exist
    if (villa.slideImages && villa.slideImages.length > 0) {
      villa.slideImages.forEach(imagePath => {
        if (!imagePath) return;
        const oldPath = path.join(__dirname, '../../../server/uploads/villa', path.basename(imagePath));
        console.log('Checking old image at:', oldPath);
        if (fs.existsSync(oldPath)) {
          console.log('Deleting old image');
          fs.unlinkSync(oldPath);
        }
      });
    }

    // Update villa with new slide image paths
    villa.slideImages = req.files.map(file => `${process.env.CLIENT_URL}/uploads/villa/${file.filename}`);
    console.log('Setting new slide image URLs:', villa.slideImages);
    await villa.save();

    console.log('Villa updated successfully');
    res.json({ message: 'Slide images updated successfully', slideImages: villa.slideImages });
  } catch (error) {
    console.error('Error updating slide images:', error);
    res.status(500).json({ message: 'Error updating slide images', error: error.message });
  }
});

router.delete('/background', async (req, res) => {
  try {
    const villa = await Villa.findOne();
    if (!villa || !villa.backgroundImage) {
      return res.status(404).json({ message: 'Background image not found' });
    }

    // Delete background image file
    const filename = villa.backgroundImage.split('/').pop();
    const filePath = path.join(__dirname, '../../../uploads/villa', filename);
    console.log('Deleting background at:', filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove background image reference from villa
    villa.backgroundImage = null;
    await villa.save();

    res.json({ message: 'Background image deleted successfully' });
  } catch (error) {
    console.error('Error deleting background image:', error);
    res.status(500).json({ message: 'Error deleting background image', error: error.message });
  }
});

router.delete('/slides/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const villa = await Villa.findOne();
    if (!villa || !villa.slideImages || !villa.slideImages[index]) {
      return res.status(404).json({ message: 'Slide image not found' });
    }

    // Delete the file
    const imagePath = villa.slideImages[index];
    if (imagePath) {
      const filename = imagePath.split('/').pop();
      const oldPath = path.join(__dirname, '../../../uploads/villa', filename);
      console.log('Deleting image at:', oldPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Remove the image from the array
    villa.slideImages.splice(index, 1);
    await villa.save();

    res.json({ message: 'Slide image deleted successfully' });
  } catch (error) {
    console.error('Error deleting slide image:', error);
    res.status(500).json({ message: 'Error deleting slide image', error: error.message });
  }
});

// Reorder slide images
router.patch('/slides/reorder', async (req, res) => {
  try {
    const { newOrder } = req.body;
    const villa = await Villa.findOne();
    
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({ message: 'Invalid order format' });
    }

    // Create new array based on the order
    const reorderedImages = newOrder.map(index => villa.slideImages[index]);
    villa.slideImages = reorderedImages;
    await villa.save();

    res.json({ message: 'Slide images reordered successfully', villa });
  } catch (error) {
    console.error('Error reordering slide images:', error);
    res.status(500).json({ message: 'Error reordering slide images' });
  }
});

// Upload PromptPay QR code
router.post('/promptpay-qr', upload.qr.single('qrImage'), async (req, res) => {
  try {
    console.log('Received file upload request');
    console.log('File:', req.file);

    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const villa = await Villa.findOne();
    if (!villa) {
      console.log('Villa not found');
      return res.status(404).json({ message: 'Villa not found' });
    }

    // Delete old QR image if it exists
    if (villa.promptPay?.qrImage) {
      const oldPath = path.join(__dirname, '../../../uploads/QR', path.basename(villa.promptPay.qrImage.split('/').pop()));
      console.log('Checking old QR at:', oldPath);
      if (fs.existsSync(oldPath)) {
        console.log('Deleting old QR');
        fs.unlinkSync(oldPath);
      }
    }

    // Update villa with new QR image path
    if (!villa.promptPay) {
      villa.promptPay = {};
    }
    villa.promptPay.qrImage = `${process.env.CLIENT_URL}/uploads/QR/${req.file.filename}`;
    console.log('Setting new QR URL:', villa.promptPay.qrImage);
    await villa.save();

    console.log('Villa updated successfully');
    res.json({ message: 'QR code uploaded successfully', qrImage: villa.promptPay.qrImage });
  } catch (error) {
    console.error('Error uploading QR code:', error);
    res.status(500).json({ message: 'Failed to upload QR code', error: error.message });
  }
});

// Delete PromptPay QR code
router.delete('/promptpay-qr', async (req, res) => {
  try {
    const villa = await Villa.findOne();
    if (!villa || !villa.promptPay?.qrImage) {
      console.log('QR code not found');
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Delete QR image file
    const filePath = path.join(__dirname, '../../../uploads/QR', path.basename(villa.promptPay.qrImage.split('/').pop()));
    console.log('Deleting QR at:', filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove QR image reference from villa
    villa.promptPay.qrImage = null;
    await villa.save();

    console.log('QR code deleted successfully');
    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ message: 'Failed to delete QR code', error: error.message });
  }
});

// Add room
router.post('/rooms', upload.rooms.array('roomImages', 10), async (req, res) => {
  try {
    const { name, description } = req.body;
    const villa = await Villa.findOne();
    
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    const images = req.files ? req.files.map(file => `${process.env.CLIENT_URL}/uploads/rooms/${file.filename}`) : [];
    
    villa.rooms.push({
      name: JSON.parse(name),
      description: JSON.parse(description),
      images
    });

    await villa.save();
    res.json({ message: 'Room added successfully', villa });
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Error adding room', error: error.message });
  }
});

// Update room
router.patch('/rooms/:index', upload.rooms.array('roomImages', 10), async (req, res) => {
  try {
    const { index } = req.params;
    const { name, description } = req.body;
    const villa = await Villa.findOne();
    
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    if (!villa.rooms[index]) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete old images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      villa.rooms[index].images.forEach(imagePath => {
        const oldPath = path.join(__dirname, '../../../server/uploads/rooms', path.basename(imagePath.split('/').pop()));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      });
      villa.rooms[index].images = req.files.map(file => `${process.env.CLIENT_URL}/uploads/rooms/${file.filename}`);
    }

    villa.rooms[index].name = JSON.parse(name);
    villa.rooms[index].description = JSON.parse(description);

    await villa.save();
    res.json({ message: 'Room updated successfully', villa });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
});

// Delete room
router.delete('/rooms/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const villa = await Villa.findOne();
    
    if (!villa) {
      return res.status(404).json({ message: 'Villa not found' });
    }

    if (!villa.rooms[index]) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Delete room images
    villa.rooms[index].images.forEach(imagePath => {
      const oldPath = path.join(__dirname, '../../../server/uploads/rooms', path.basename(imagePath.split('/').pop()));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    });

    villa.rooms.splice(index, 1);
    await villa.save();
    res.json({ message: 'Room deleted successfully', villa });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

export default router;
