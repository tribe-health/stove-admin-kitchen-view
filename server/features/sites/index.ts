
import { Router } from 'express';
import { SiteController } from './site-controller';

const router = Router();
const siteController = new SiteController();

// GET all sites
router.get('/', siteController.getAllSites);

// GET site by ID
router.get('/:id', siteController.getSiteById);

// POST create new site
router.post('/', siteController.createSite);

// PUT update site
router.put('/:id', siteController.updateSite);

// DELETE site
router.delete('/:id', siteController.deleteSite);

export { router as siteRoutes };
