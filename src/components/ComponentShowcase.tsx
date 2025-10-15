import React, { useState } from 'react';
import Button from './Button';
import Card from './Card';
import SkeletonCard from './SkeletonCard';
import { Play, Download, Trash2, Check, Sparkles } from 'lucide-react';

/**
 * Component Showcase - Phase 1 Testing
 * Temporary component to test new UI enhancements
 * 
 * To view: Add this to your routes temporarily
 */
const ComponentShowcase: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white font-display">
            Blueprint UI Components
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Phase 1: Foundation - Component Showcase
          </p>
        </div>

        {/* Button Variants */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Button Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary">
              Primary Button
            </Button>
            <Button variant="secondary">
              Secondary Button
            </Button>
            <Button variant="outline">
              Outline Button
            </Button>
            <Button variant="ghost">
              Ghost Button
            </Button>
            <Button variant="destructive">
              Destructive
            </Button>
            <Button variant="success">
              Success
            </Button>
            <Button variant="gradient">
              Gradient
            </Button>
            <Button variant="primary" loading={loading} onClick={handleClick}>
              {loading ? 'Loading...' : 'Click Me'}
            </Button>
          </div>
        </section>

        {/* Button Sizes */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Button Sizes
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <Button size="xs" variant="primary">Extra Small</Button>
            <Button size="sm" variant="primary">Small</Button>
            <Button size="md" variant="primary">Medium</Button>
            <Button size="lg" variant="primary">Large</Button>
            <Button size="xl" variant="primary">Extra Large</Button>
          </div>
        </section>

        {/* Buttons with Icons */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Buttons with Icons (Hover to see animation)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="primary" icon={<Play size={16} />}>
              Play Video
            </Button>
            <Button variant="success" icon={<Download size={16} />}>
              Download
            </Button>
            <Button variant="destructive" icon={<Trash2 size={16} />}>
              Delete
            </Button>
            <Button variant="gradient" icon={<Sparkles size={16} />} iconPosition="right">
              AI Generate
            </Button>
          </div>
        </section>

        {/* Card Variants */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Card Variants (Hover to see lift effect)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default" hover>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Default Card
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clean white background with soft shadow. Lifts on hover.
              </p>
            </Card>

            <Card variant="gradient" hover>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Gradient Card
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Subtle gradient background for depth.
              </p>
            </Card>

            <Card variant="glass" hover>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Glass Card
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Frosted glass effect with backdrop blur. Very premium.
              </p>
            </Card>

            <Card variant="bordered" hover>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Bordered Card
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Prominent colored border that brightens on hover.
              </p>
            </Card>

            <Card variant="glow" hover>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Glow Card
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Subtle glow effect for AI features and highlights.
              </p>
            </Card>

            <Card variant="glass" clickable hover>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-blue/10 rounded-lg">
                  <Check className="text-brand-blue" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Clickable Card
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    With cursor pointer
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Stat Cards */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Stat Cards with Vibrant Colors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" hover>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
                <span className="text-xs px-2 py-1 bg-financial-green/10 text-financial-green rounded-full">
                  +12.5%
                </span>
              </div>
              <p className="text-3xl font-bold text-financial-green font-mono">
                $2,450,000
              </p>
            </Card>

            <Card variant="glass" hover>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Actual Spent</p>
                <span className="text-xs px-2 py-1 bg-financial-red/10 text-financial-red rounded-full">
                  -8.2%
                </span>
              </div>
              <p className="text-3xl font-bold text-financial-red font-mono">
                $2,120,000
              </p>
            </Card>

            <Card variant="glass" hover>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI (Base)</p>
                <span className="text-xs px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-full">
                  Target
                </span>
              </div>
              <p className="text-3xl font-bold text-brand-blue font-mono">
                18.5%
              </p>
            </Card>

            <Card variant="glass" hover glow>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Insights</p>
                <Sparkles className="text-ai-purple" size={16} />
              </div>
              <p className="text-3xl font-bold text-ai-purple font-mono">
                12
              </p>
            </Card>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Loading States (Skeleton Cards with Shimmer)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard variant="card" />
            <SkeletonCard variant="stat" />
            <SkeletonCard variant="chart" />
            <SkeletonCard variant="text" rows={4} />
            <SkeletonCard variant="card" />
            <SkeletonCard variant="stat" />
          </div>
        </section>

        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <div className="h-20 rounded-lg bg-brand-blue"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Brand Blue</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-brand-purple"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Brand Purple</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-financial-green"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Success Green</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-financial-red"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Danger Red</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-financial-amber"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Warning Amber</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-ai-purple"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">AI Purple</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Typography (Inter Font)
          </h2>
          <Card variant="glass">
            <h1 className="text-5xl font-bold mb-4 font-display">Display Heading</h1>
            <h2 className="text-4xl font-bold mb-3">Heading 1</h2>
            <h3 className="text-3xl font-semibold mb-3">Heading 2</h3>
            <h4 className="text-2xl font-semibold mb-3">Heading 3</h4>
            <p className="text-lg mb-3">Large body text - Inter font family</p>
            <p className="text-base mb-3">Regular body text - Perfect for reading</p>
            <p className="text-sm mb-3">Small text for labels and captions</p>
            <p className="font-mono text-base">$2,450,000 - Monospace for numbers</p>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ComponentShowcase;

