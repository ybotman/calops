import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Application from '@/models/Application';

// GET application by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    const application = await Application.findOne({ appId: id })
      .populate('settings.defaultRegionId')
      .populate('settings.defaultDivisionId')
      .populate('settings.defaultCityId');
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    return NextResponse.json(application);
  } catch (error) {
    console.error(`Error fetching application ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// PATCH update application by ID
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const updates = await request.json();
    
    const application = await Application.findOne({ appId: id });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Handle nested updates
    Object.keys(updates).forEach(key => {
      if (key === 'settings') {
        application.settings = {
          ...application.settings.toObject(),
          ...updates.settings
        };
      } else {
        application[key] = updates[key];
      }
    });
    
    application.updatedAt = new Date();
    await application.save();
    
    // Return updated application with populated fields
    const updatedApplication = await Application.findById(application._id)
      .populate('settings.defaultRegionId')
      .populate('settings.defaultDivisionId')
      .populate('settings.defaultCityId');
    
    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error(`Error updating application ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// DELETE application by ID
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';
    
    const application = await Application.findOne({ appId: id });
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    if (hardDelete) {
      // Hard delete - remove from database
      await Application.findByIdAndDelete(application._id);
      return NextResponse.json({ message: 'Application deleted successfully' });
    } else {
      // Soft delete - set isActive to false
      application.isActive = false;
      application.updatedAt = new Date();
      await application.save();
      return NextResponse.json({ message: 'Application deactivated successfully' });
    }
  } catch (error) {
    console.error(`Error deleting application ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}