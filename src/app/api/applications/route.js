import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Application from '@/models/Application';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined;
    
    // Build query
    const query = {};
    if (active !== undefined) query.isActive = active;
    
    // Fetch applications
    const applications = await Application.find(query)
      .populate('settings.defaultRegionId')
      .populate('settings.defaultDivisionId')
      .populate('settings.defaultCityId')
      .sort({ name: 1 });
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Ensure appId is unique
    const existingApp = await Application.findOne({ appId: data.appId });
    if (existingApp) {
      return NextResponse.json(
        { error: 'Application with this appId already exists' },
        { status: 400 }
      );
    }
    
    // Create new application
    const newApplication = new Application(data);
    await newApplication.save();
    
    return NextResponse.json(
      { message: 'Application created successfully', application: newApplication },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}