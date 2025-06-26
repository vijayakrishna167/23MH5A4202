const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const Url = require('../models/Url');
const Log = require('../utils/logger');

// @route    POST /api/shorturls
// @desc     Create new short URL
router.post('/shorturls', async (req, res) => {
  const { url, validity, shortcode } = req.body;

  // Validate URL format
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  if (!urlRegex.test(url)) {
    Log("backend", "error", "handler", `Invalid URL format: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Check if custom shortcode is already in use
  if (shortcode) {
    const existingUrl = await Url.findOne({ shortCode: shortcode });
    if (existingUrl) {
      Log("backend", "error", "handler", `Custom shortcode already in use: ${shortcode}`);
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
    Log("backend", "info", "handler", `Short URL created: ${newShortCode} for ${url}`);
    res.status(201).json({
      shortLink: `${req.protocol}://${req.get('host')}/${newShortCode}`,
      expiry: expiresAt.toISOString(),
    });
  } catch (err) {
    Log("backend", "error", "handler", `Server error during URL creation: ${err.message}`);
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
        Log("backend", "warn", "handler", `Expired shortcode accessed: ${req.params.shortCode}`);
        return res.status(404).json('Short URL has expired');
      }

      // Record click
      url.clicks.push({
        timestamp: new Date(),
        referrer: req.get('Referrer') || 'direct',
        ip: req.ip,
      });
      await url.save();
      Log("backend", "info", "handler", `Redirecting ${req.params.shortCode} to ${url.longUrl}`);
      return res.redirect(url.longUrl);
    } else {
      Log("backend", "warn", "handler", `Shortcode not found: ${req.params.shortCode}`);
      return res.status(404).json('No short URL found');
    }
  } catch (err) {
    Log("backend", "error", "handler", `Server error during redirection: ${err.message}`);
    res.status(500).send('Server error');
  }
});

// @route    GET /api/shorturls/:shortCode
// @desc     Retrieve short URL statistics
router.get('/shorturls/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (url) {
      Log("backend", "info", "handler", `Retrieved statistics for shortcode: ${req.params.shortCode}`);
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
      Log("backend", "warn", "handler", `Statistics requested for non-existent shortcode: ${req.params.shortCode}`);
      return res.status(404).json('No short URL found for statistics');
    }
  } catch (err) {
    Log("backend", "error", "handler", `Server error during statistics retrieval: ${err.message}`);
    res.status(500).send('Server error');
  }
});

module.exports = router; 