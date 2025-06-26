const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const Url = require('../models/Url');
const logger = require('../middleware/logger');

// @route    POST /api/shorturls
// @desc     Create new short URL
router.post('/shorturls', async (req, res) => {
  const { url, validity, shortcode } = req.body;

  // Validate URL format
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  if (!urlRegex.test(url)) {
    logger.error(`Invalid URL format: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Check if custom shortcode is already in use
  if (shortcode) {
    const existingUrl = await Url.findOne({ shortCode: shortcode });
    if (existingUrl) {
      logger.error(`Custom shortcode already in use: ${shortcode}`);
      return res.status(409).json({ error: 'Custom shortcode already in use' });
    }
  }

  try {
    let newShortCode = shortcode || shortid.generate();
    let expiresAt = null;

    if (validity) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + validity);
    } else {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Default validity: 30 minutes
    }

    const newUrl = new Url({
      shortCode: newShortCode,
      longUrl: url,
      expiresAt,
    });

    await newUrl.save();
    logger.info(`Short URL created: ${newShortCode} for ${url}`);
    res.status(201).json({
      shortLink: `${req.protocol}://${req.get('host')}/${newShortCode}`,
      expiry: expiresAt.toISOString(),
    });
  } catch (err) {
    logger.error(`Server error during URL creation: ${err.message}`);
    res.status(500).send('Server error');
  }
});

// @route    GET /:shortCode
// @desc     Redirect to long URL and record click
router.get('/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (url) {
      if (url.expiresAt && url.expiresAt < new Date()) {
        logger.warn(`Expired shortcode accessed: ${req.params.shortCode}`);
        return res.status(404).json('Short URL has expired');
      }

      // Record click
      url.clicks.push({
        timestamp: new Date(),
        referrer: req.get('Referrer') || 'direct',
        ip: req.ip,
      });
      await url.save();
      logger.info(`Redirecting ${req.params.shortCode} to ${url.longUrl}`);
      return res.redirect(url.longUrl);
    } else {
      logger.warn(`Shortcode not found: ${req.params.shortCode}`);
      return res.status(404).json('No short URL found');
    }
  } catch (err) {
    logger.error(`Server error during redirection: ${err.message}`);
    res.status(500).send('Server error');
  }
});

// @route    GET /api/shorturls/:shortCode
// @desc     Retrieve short URL statistics
router.get('/shorturls/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (url) {
      logger.info(`Retrieved statistics for shortcode: ${req.params.shortCode}`);
      res.json({
        totalClicks: url.clicks.length,
        originalUrl: url.longUrl,
        creationDate: url.createdAt.toISOString(),
        expiryDate: url.expiresAt ? url.expiresAt.toISOString() : 'Never expires',
        clickData: url.clicks.map(click => ({
          timestamp: click.timestamp.toISOString(),
          referrer: click.referrer,
          ip: click.ip,
        })),
      });
    } else {
      logger.warn(`Statistics requested for non-existent shortcode: ${req.params.shortCode}`);
      return res.status(404).json('No short URL found for statistics');
    }
  } catch (err) {
    logger.error(`Server error during statistics retrieval: ${err.message}`);
    res.status(500).send('Server error');
  }
});

module.exports = router; 